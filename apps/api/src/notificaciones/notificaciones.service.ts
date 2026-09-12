import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class NotificacionesService {
  constructor(private readonly prisma: PrismaService) {}

  async crear(datos: {
    usuarioId: string;
    tipo: string;
    titulo: string;
    cuerpo: string;
    enlace?: string;
  }): Promise<void> {
    await this.prisma.notificacion.create({ data: datos });
  }

  async crearVarias(
    usuarioIds: string[],
    datos: { tipo: string; titulo: string; cuerpo: string; enlace?: string },
  ): Promise<void> {
    if (usuarioIds.length === 0) return;
    await this.prisma.notificacion.createMany({
      data: usuarioIds.map((usuarioId) => ({ usuarioId, ...datos })),
    });
  }

  listar(usuarioId: string, soloNoLeidas = false) {
    return this.prisma.notificacion.findMany({
      where: { usuarioId, leidaEn: soloNoLeidas ? null : undefined },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  }

  contarNoLeidas(usuarioId: string) {
    return this.prisma.notificacion.count({ where: { usuarioId, leidaEn: null } });
  }

  async marcarLeida(usuarioId: string, id: string): Promise<void> {
    await this.prisma.notificacion.updateMany({
      where: { id, usuarioId, leidaEn: null },
      data: { leidaEn: new Date() },
    });
  }

  async marcarTodasLeidas(usuarioId: string): Promise<void> {
    await this.prisma.notificacion.updateMany({
      where: { usuarioId, leidaEn: null },
      data: { leidaEn: new Date() },
    });
  }
}
