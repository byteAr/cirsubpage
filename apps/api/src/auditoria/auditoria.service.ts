import { Injectable, Logger } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

export interface EntradaAuditoria {
  usuarioId?: string | null;
  accion: string;
  entidad: string;
  entidadId?: string | null;
  resumen: string;
  datos?: Prisma.InputJsonValue;
  ip?: string | null;
  nivel?: 'info' | 'warn' | 'error';
}

@Injectable()
export class AuditoriaService {
  private readonly log = new Logger(AuditoriaService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Deja constancia de una acción.
   *
   * Nunca hace fallar la operación que la originó: si la auditoría se rompe,
   * se registra el problema pero el usuario igual completa lo que estaba haciendo.
   */
  async registrar(entrada: EntradaAuditoria): Promise<void> {
    try {
      await this.prisma.auditoria.create({
        data: {
          usuarioId: entrada.usuarioId ?? null,
          accion: entrada.accion,
          entidad: entrada.entidad,
          entidadId: entrada.entidadId ?? null,
          resumen: entrada.resumen,
          datos: entrada.datos,
          ip: entrada.ip ?? null,
          nivel: entrada.nivel ?? 'info',
        },
      });
    } catch (error) {
      this.log.error(`No se pudo registrar la auditoría "${entrada.accion}"`, error as Error);
    }
  }

  async listar(opciones: {
    pagina?: number;
    porPagina?: number;
    usuarioId?: string;
    entidad?: string;
    nivel?: string;
    desde?: Date;
    hasta?: Date;
  }) {
    const pagina = Math.max(1, opciones.pagina ?? 1);
    const porPagina = Math.min(100, Math.max(1, opciones.porPagina ?? 25));

    const where: Prisma.AuditoriaWhereInput = {
      usuarioId: opciones.usuarioId,
      entidad: opciones.entidad,
      nivel: opciones.nivel,
      createdAt:
        opciones.desde || opciones.hasta
          ? { gte: opciones.desde, lte: opciones.hasta }
          : undefined,
    };

    const [items, total] = await this.prisma.$transaction([
      this.prisma.auditoria.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (pagina - 1) * porPagina,
        take: porPagina,
        include: { usuario: { select: { id: true, nombre: true, email: true } } },
      }),
      this.prisma.auditoria.count({ where }),
    ]);

    return {
      items,
      total,
      pagina,
      porPagina,
      totalPaginas: Math.max(1, Math.ceil(total / porPagina)),
    };
  }
}
