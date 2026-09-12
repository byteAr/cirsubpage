import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';
import type { Configuracion } from '../config/configuracion';
import { plantilla, type DatosPlantilla } from './plantillas';

@Injectable()
export class CorreoService implements OnModuleInit {
  private readonly log = new Logger(CorreoService.name);
  private transporte: Transporter | null = null;

  constructor(private readonly config: ConfigService<Configuracion, true>) {}

  onModuleInit(): void {
    const cfg = this.config.get('correo', { infer: true });

    if (!cfg.habilitado) {
      this.log.warn('Envío de correo deshabilitado: los mensajes se escriben en el log');
      return;
    }

    this.transporte = nodemailer.createTransport({
      host: cfg.host,
      port: cfg.puerto,
      secure: cfg.seguro,
      auth: { user: cfg.usuario, pass: cfg.password },
    });
  }

  async enviarInvitacion(
    email: string,
    nombre: string,
    token: string,
    rol: string,
    horas: number,
  ): Promise<void> {
    const app = this.config.get('app', { infer: true });
    await this.enviar('invitacion', email, `Te invitaron al panel de ${app.nombre}`, {
      nombre,
      rol,
      horas,
      enlace: `${app.urlSitio}/admin/activar?token=${encodeURIComponent(token)}`,
      urlSitio: app.urlSitio,
    });
  }

  async enviarReset(email: string, nombre: string, token: string, minutos: number): Promise<void> {
    const app = this.config.get('app', { infer: true });
    await this.enviar('reset', email, 'Restablecer tu contraseña', {
      nombre,
      minutos,
      enlace: `${app.urlSitio}/admin/restablecer?token=${encodeURIComponent(token)}`,
      urlSitio: app.urlSitio,
    });
  }

  async enviarNovedadParaRevisar(
    email: string,
    revisor: string,
    titulo: string,
    autor: string,
    filial: string | null,
    novedadId: string,
  ): Promise<void> {
    const app = this.config.get('app', { infer: true });
    await this.enviar('novedad-para-revisar', email, `Novedad para revisar: ${titulo}`, {
      nombre: revisor,
      titulo,
      autor,
      filial: filial ?? 'Sede Central',
      enlace: `${app.urlSitio}/admin/novedades/${novedadId}`,
      urlSitio: app.urlSitio,
    });
  }

  async enviarNovedadAprobada(
    email: string,
    autor: string,
    titulo: string,
    slug: string,
  ): Promise<void> {
    const app = this.config.get('app', { infer: true });
    await this.enviar('novedad-aprobada', email, `Publicamos tu novedad: ${titulo}`, {
      nombre: autor,
      titulo,
      enlace: `${app.urlSitio}/novedades/${slug}`,
      urlSitio: app.urlSitio,
    });
  }

  async enviarNovedadRechazada(
    email: string,
    autor: string,
    titulo: string,
    motivo: string,
    novedadId: string,
  ): Promise<void> {
    const app = this.config.get('app', { infer: true });
    await this.enviar('novedad-rechazada', email, `Tu novedad necesita cambios: ${titulo}`, {
      nombre: autor,
      titulo,
      motivo,
      enlace: `${app.urlSitio}/admin/novedades/${novedadId}`,
      urlSitio: app.urlSitio,
    });
  }

  // ─────────────────────────────────────────────────────────────────────────

  private async enviar(
    nombrePlantilla: string,
    para: string,
    asunto: string,
    datos: DatosPlantilla,
  ): Promise<void> {
    const cfg = this.config.get('correo', { infer: true });
    const { html, texto } = plantilla(nombrePlantilla, { ...datos, asunto });

    if (!this.transporte) {
      this.log.log(`[correo simulado] a ${para} · ${asunto}\n${texto}`);
      return;
    }

    try {
      await this.transporte.sendMail({
        from: cfg.remitente,
        replyTo: cfg.responderA,
        to: para,
        subject: asunto,
        text: texto,
        html,
      });
    } catch (error) {
      // El correo no debe tumbar la operación: la invitación queda creada y
      // se puede reenviar desde el panel.
      this.log.error(`Falló el envío de "${asunto}" a ${para}`, error as Error);
    }
  }
}
