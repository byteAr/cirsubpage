import { Controller, Get } from '@nestjs/common';
import { ESTADO_NOVEDAD, PERMISOS } from '@cirsub/shared';
import { PrismaService } from '../prisma/prisma.service';
import {
  RequierePermiso,
  UsuarioActual,
  alcanceDe,
  type UsuarioPeticion,
} from '../comun/permisos.guard';

@Controller('tablero')
export class TableroController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  @RequierePermiso(PERMISOS.TABLERO_VER)
  async resumen(@UsuarioActual() usuario: UsuarioPeticion) {
    // Un referente ve los números de su filial, no los de todo el país.
    const propio = alcanceDe(usuario, PERMISOS.NOVEDADES_CREAR) === 'propio';
    const scope = propio && usuario.filialId ? { filialId: usuario.filialId } : {};

    const [publicadas, borradores, enRevision, cambiosPedidos, medios, usuarios, ultimas] =
      await this.prisma.$transaction([
        this.prisma.novedad.count({ where: { ...scope, estado: ESTADO_NOVEDAD.PUBLICADA } }),
        this.prisma.novedad.count({ where: { ...scope, estado: ESTADO_NOVEDAD.BORRADOR } }),
        this.prisma.novedad.count({ where: { ...scope, estado: ESTADO_NOVEDAD.EN_REVISION } }),
        this.prisma.novedad.count({ where: { ...scope, estado: ESTADO_NOVEDAD.CAMBIOS_PEDIDOS } }),
        this.prisma.medio.count(),
        this.prisma.usuario.count({ where: { estado: 'ACTIVO' } }),
        this.prisma.novedad.findMany({
          where: scope,
          orderBy: { updatedAt: 'desc' },
          take: 6,
          include: {
            autor: { select: { nombre: true } },
            filial: { select: { nombre: true } },
          },
        }),
      ]);

    const actividad = alcanceDe(usuario, PERMISOS.AUDITORIA_VER)
      ? await this.prisma.auditoria.findMany({
          orderBy: { createdAt: 'desc' },
          take: 8,
          include: { usuario: { select: { nombre: true } } },
        })
      : [];

    return {
      metricas: { publicadas, borradores, enRevision, cambiosPedidos, medios, usuarios },
      ultimas,
      actividad,
    };
  }
}
