import { Injectable, NgZone, OnDestroy, PLATFORM_ID, inject, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { io, type Socket } from 'socket.io-client';
import { BASE_API } from '../base-api';
import { SesionService } from './sesion.service';
import type { NotificacionPanel } from './panel.service';

/**
 * Conexión en vivo con la API para que las notificaciones lleguen al momento.
 *
 * Usa el mismo token de acceso que el resto del panel y lo pide de nuevo en cada
 * reconexión, así que sobrevive a que el token venza. Si el proxy no deja pasar
 * WebSocket, Socket.IO cae solo a sondeo. Sólo corre en el navegador.
 */
@Injectable({ providedIn: 'root' })
export class TiempoRealService implements OnDestroy {
  private readonly sesion = inject(SesionService);
  private readonly zona = inject(NgZone);
  private readonly base = inject(BASE_API);
  private readonly navegador = isPlatformBrowser(inject(PLATFORM_ID));

  private socket: Socket | null = null;
  private readonly oyentes = new Set<(n: NotificacionPanel) => void>();

  readonly conectado = signal(false);

  conectar(): void {
    if (!this.navegador || this.socket) return;

    const destino = new URL(this.base, window.location.origin);
    this.socket = io(destino.origin, {
      path: '/api/socket.io',
      transports: ['websocket', 'polling'],
      auth: (responder) => {
        void this.sesion.tokenValido().then((token) => responder({ token }));
      },
    });

    this.socket.on('connect', () => this.zona.run(() => this.conectado.set(true)));
    this.socket.on('disconnect', () => this.zona.run(() => this.conectado.set(false)));
    this.socket.on('notificacion', (n: NotificacionPanel) =>
      this.zona.run(() => this.oyentes.forEach((f) => f(n))),
    );
  }

  /** Avisa cada notificación nueva. Devuelve la función para dejar de escuchar. */
  alRecibir(oyente: (n: NotificacionPanel) => void): () => void {
    this.oyentes.add(oyente);
    return () => this.oyentes.delete(oyente);
  }

  desconectar(): void {
    this.socket?.disconnect();
    this.socket = null;
    this.conectado.set(false);
  }

  ngOnDestroy(): void {
    this.desconectar();
  }
}
