import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NotificacionesGateway } from './notificaciones.gateway';

@Injectable()
export class NotificacionesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly enVivo: NotificacionesGateway,
  ) {}

  async crear(datos: {
    usuarioId: string;
    tipo: string;
    titulo: string;
    cuerpo: string;
    enlace?: string;
  }): Promise<void> {
    const creada = await this.prisma.notificacion.create({ data: datos });
    this.enVivo.enviar(creada.usuarioId, creada);
  }

  async crearVarias(
    usuarioIds: string[],
    datos: { tipo: string; titulo: string; cuerpo: string; enlace?: string },
  ): Promise<void> {
    if (usuarioIds.length === 0) return;
    const creadas = await this.prisma.notificacion.createManyAndReturn({
      data: usuarioIds.map((usuarioId) => ({ usuarioId, ...datos })),
    });
    for (const n of creadas) this.enVivo.enviar(n.usuarioId, n);
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
