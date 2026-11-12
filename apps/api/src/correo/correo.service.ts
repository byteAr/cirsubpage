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

    /*
      Sin usuario configurado no se manda `auth`.

      El relay de Google Workspace autoriza por la IP del servidor, así que no
      hay con qué autenticarse: mandándole un usuario y una contraseña vacíos,
      nodemailer intenta igual el AUTH y la conexión se cae antes de enviar nada.
      Con credenciales, en cambio, sigue valiendo el SMTP de siempre.
    */
    const autenticado = Boolean(cfg.usuario && cfg.password);

    /*
      Cómo se presenta el servidor al saludar (EHLO). Por defecto nodemailer usa
      el nombre de la máquina, que en Docker es el del contenedor: algo como
      «a1b2c3d4», que no es un dominio. El relay de Google rechaza a veces esos
      saludos con «421 4.7.0 Try again later (EHLO)», y el correo no sale.
    */
    const nombre = new URL(this.config.get('app', { infer: true }).urlSitio).hostname;

    this.transporte = nodemailer.createTransport({
      host: cfg.host,
      port: cfg.puerto,
      secure: cfg.seguro,
      name: nombre,
      ...(autenticado ? { auth: { user: cfg.usuario, pass: cfg.password } } : {}),
    });

    this.log.log(
      `Correo por ${cfg.host}:${cfg.puerto} como ${nombre}, ` +
        (autenticado ? `autenticado como ${cfg.usuario}` : 'autorizado por IP, sin credenciales'),
    );
  }

  async enviarInvitacion(
    email: string,
    nombre: string,
    token: string,
    responsabilidad: { titulo: string; tareas: readonly string[]; coordinador: boolean },
    horas: number,
  ): Promise<boolean> {
    const app = this.config.get('app', { infer: true });
    return this.enviar(
      responsabilidad.coordinador ? 'invitacion-coordinador' : 'invitacion',
      email,
      responsabilidad.coordinador
        ? `Invitación personal: ${responsabilidad.titulo}`
        : `Te designaron ${responsabilidad.titulo}`,
      {
        nombre,
        titulo: responsabilidad.titulo,
        tareas: responsabilidad.tareas.join('\n'),
        horas,
        enlace: `${app.urlSitio}/admin/activar?token=${encodeURIComponent(token)}`,
        urlSitio: app.urlSitio,
      },
    );
  }

  /** Aviso a quien ya tiene cuenta y pasa a hacerse cargo de algo. */
  async enviarDesignacion(
    email: string,
    nombre: string,
    responsabilidad: { titulo: string; tareas: readonly string[] },
  ): Promise<boolean> {
    const app = this.config.get('app', { infer: true });
    return this.enviar('designacion', email, `Ahora sos ${responsabilidad.titulo}`, {
      nombre,
      titulo: responsabilidad.titulo,
      tareas: responsabilidad.tareas.join('\n'),
      enlace: `${app.urlSitio}/admin`,
      urlSitio: app.urlSitio,
    });
  }

  async enviarReset(email: string, nombre: string, token: string, minutos: number): Promise<boolean> {
    const app = this.config.get('app', { infer: true });
    return this.enviar('reset', email, 'Restablecer tu contraseña', {
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
  ): Promise<boolean> {
    const app = this.config.get('app', { infer: true });
    return this.enviar('novedad-para-revisar', email, `Novedad para revisar: ${titulo}`, {
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
  ): Promise<boolean> {
    const app = this.config.get('app', { infer: true });
    return this.enviar('novedad-aprobada', email, `Publicamos tu novedad: ${titulo}`, {
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
  ): Promise<boolean> {
    const app = this.config.get('app', { infer: true });
    return this.enviar('novedad-rechazada', email, `Tu novedad necesita cambios: ${titulo}`, {
      nombre: autor,
      titulo,
      motivo,
      enlace: `${app.urlSitio}/admin/novedades/${novedadId}`,
      urlSitio: app.urlSitio,
    });
  }

  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Envía y dice si salió. Nunca lanza: el correo no debe tumbar la operación,
   * pero quien llama tiene que poder avisar que no se mandó.
   *
   * Los rechazos temporales de Google (códigos 4xx, como «421 Try again later»)
   * se reintentan dos veces, con un poco de espera entre una y otra.
   */
  private async enviar(
    nombrePlantilla: string,
    para: string,
    asunto: string,
    datos: DatosPlantilla,
  ): Promise<boolean> {
    const cfg = this.config.get('correo', { infer: true });
    const { html, texto } = plantilla(nombrePlantilla, { ...datos, asunto });

    if (!this.transporte) {
      this.log.log(`[correo simulado] a ${para} · ${asunto}\n${texto}`);
      return true;
    }

    const esperas = [0, 2000, 6000];
    for (const [intento, espera] of esperas.entries()) {
      if (espera) await new Promise((r) => setTimeout(r, espera));
      try {
        await this.transporte.sendMail({
          from: cfg.remitente,
          replyTo: cfg.responderA,
          to: para,
          subject: asunto,
          text: texto,
          html,
        });
        if (intento > 0) this.log.log(`"${asunto}" a ${para} salió en el intento ${intento + 1}`);
        return true;
      } catch (error) {
        const codigo = (error as { responseCode?: number }).responseCode ?? 0;
        const temporal = (codigo >= 400 && codigo < 500) || !codigo;
        const ultimo = intento === esperas.length - 1;
        if (!temporal || ultimo) {
          this.log.error(`Falló el envío de "${asunto}" a ${para}`, error as Error);
          return false;
        }
        this.log.warn(`Rechazo temporal enviando "${asunto}" a ${para} (${codigo}): se reintenta`);
      }
    }
    return false;
  }
}
