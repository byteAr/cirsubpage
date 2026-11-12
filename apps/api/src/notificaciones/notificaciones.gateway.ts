import { Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import {
  OnGatewayConnection,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import type { Server, Socket } from 'socket.io';
import { configuracion } from '../config/configuracion';
import { PrismaService } from '../prisma/prisma.service';

export interface NotificacionEnVivo {
  id: string;
  tipo: string;
  titulo: string;
  cuerpo: string;
  enlace: string | null;
  createdAt: Date;
  leidaEn: Date | null;
}

const sala = (usuarioId: string) => `u:${usuarioId}`;

/**
 * Avisos en tiempo real para la campanita del panel.
 *
 * Vive bajo /api/socket.io para usar el mismo camino que la API: nginx ya lo
 * manda al contenedor. Si el proxy no deja pasar WebSocket, Socket.IO sigue
 * funcionando por sondeo, más lento pero sin perder avisos.
 *
 * El cliente se autentica con el mismo token de acceso que usa la API, y cada
 * persona entra a una sala propia: nadie recibe los avisos de otro.
 */
@WebSocketGateway({
  path: '/api/socket.io',
  cors: { origin: configuracion().app.origenesPermitidos, credentials: true },
})
export class NotificacionesGateway implements OnGatewayConnection {
  private readonly log = new Logger(NotificacionesGateway.name);

  @WebSocketServer()
  private readonly servidor!: Server;

  constructor(
    private readonly jwt: JwtService,
    private readonly prisma: PrismaService,
  ) {}

  async handleConnection(cliente: Socket): Promise<void> {
    try {
      const token = (cliente.handshake.auth as { token?: string } | undefined)?.token;
      if (!token) throw new Error('sin token');

      const carga = await this.jwt.verifyAsync<{ sub: string; tipo: string }>(token);
      if (carga.tipo !== 'acceso') throw new Error('token de otro tipo');

      const usuario = await this.prisma.usuario.findUnique({
        where: { id: carga.sub },
        select: { estado: true, eliminadoEn: true },
      });
      if (!usuario || usuario.estado !== 'ACTIVO' || usuario.eliminadoEn) {
        throw new Error('cuenta inactiva');
      }

      await cliente.join(sala(carga.sub));
    } catch {
      // Sin sesión válida no hay avisos: se corta sin decir por qué.
      cliente.disconnect(true);
    }
  }

  enviar(usuarioId: string, notificacion: NotificacionEnVivo): void {
    this.servidor?.to(sala(usuarioId)).emit('notificacion', notificacion);
  }

  /** Corta las conexiones abiertas de alguien al suspenderlo o eliminarlo. */
  desconectar(usuarioId: string): void {
    this.servidor?.in(sala(usuarioId)).disconnectSockets(true);
    this.log.log(`Conexiones en vivo cerradas para ${usuarioId}`);
  }
}
