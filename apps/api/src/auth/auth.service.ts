import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as argon2 from 'argon2';
import { authenticator } from 'otplib';
import { validarContrasena, type ResultadoIngreso, type UsuarioSesion } from '@cirsub/shared';
import { PrismaService } from '../prisma/prisma.service';
import { CorreoService } from '../correo/correo.service';
import { AuditoriaService } from '../auditoria/auditoria.service';
import { TokensService } from './tokens.service';
import { permisosEfectivos } from './permisos-efectivos';
import type { Configuracion } from '../config/configuracion';

interface DatosPeticion {
  ip?: string;
  userAgent?: string;
}

@Injectable()
export class AuthService {
  private readonly log = new Logger(AuthService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly tokens: TokensService,
    private readonly correo: CorreoService,
    private readonly auditoria: AuditoriaService,
    private readonly config: ConfigService<Configuracion, true>,
  ) {}

  // ─────────────────────────────── Ingreso ──────────────────────────────────

  async ingresar(
    email: string,
    password: string,
    codigoTotp: string | undefined,
    datos: DatosPeticion,
  ): Promise<{ resultado: ResultadoIngreso; refresh?: string }> {
    const seguridad = this.config.get('seguridad', { infer: true });

    const usuario = await this.prisma.usuario.findUnique({
      where: { email: email.toLowerCase().trim() },
      include: {
        rol: { include: { permisos: { include: { permiso: true } } } },
        permisos: { include: { permiso: true } },
        filial: true,
      },
    });

    // Mismo mensaje exista o no la cuenta: no confirmamos qué correos están registrados.
    const credencialesInvalidas = new UnauthorizedException('Correo o contraseña incorrectos');

    if (!usuario || !usuario.passwordHash) {
      await this.retardoAntiEnumeracion();
      throw credencialesInvalidas;
    }

    if (usuario.bloqueadoHasta && usuario.bloqueadoHasta > new Date()) {
      throw new ForbiddenException(
        'La cuenta está bloqueada por intentos fallidos. Probá de nuevo en unos minutos.',
      );
    }

    if (usuario.estado === 'SUSPENDIDO') {
      throw new ForbiddenException('Tu acceso está suspendido. Hablá con el administrador.');
    }

    if (usuario.estado === 'INVITADO') {
      throw new ForbiddenException('Todavía no activaste tu cuenta. Revisá el correo de invitación.');
    }

    const valida = await argon2.verify(usuario.passwordHash, password);
    if (!valida) {
      const intentos = usuario.intentosFallidos + 1;
      const bloquear = intentos >= seguridad.maxIntentosIngreso;
      await this.prisma.usuario.update({
        where: { id: usuario.id },
        data: {
          intentosFallidos: bloquear ? 0 : intentos,
          bloqueadoHasta: bloquear
            ? new Date(Date.now() + seguridad.bloqueoMinutos * 60_000)
            : null,
        },
      });
      await this.auditoria.registrar({
        usuarioId: usuario.id,
        accion: 'ingreso.fallido',
        entidad: 'usuario',
        entidadId: usuario.id,
        resumen: bloquear ? 'Intento fallido, cuenta bloqueada' : 'Intento de ingreso fallido',
        ip: datos.ip,
        nivel: 'warn',
      });
      throw credencialesInvalidas;
    }

    if (usuario.totpHabilitado && usuario.totpSecret) {
      if (!codigoTotp) {
        return { resultado: { requiereTotp: true, desafio: usuario.id } };
      }
      const ok = authenticator.check(codigoTotp, usuario.totpSecret);
      if (!ok) throw new UnauthorizedException('El código de verificación no es válido');
    }

    await this.prisma.usuario.update({
      where: { id: usuario.id },
      data: { intentosFallidos: 0, bloqueadoHasta: null, ultimoAcceso: new Date() },
    });

    await this.auditoria.registrar({
      usuarioId: usuario.id,
      accion: 'ingreso',
      entidad: 'usuario',
      entidadId: usuario.id,
      resumen: 'Inició sesión',
      ip: datos.ip,
    });

    const refresh = await this.emitirRefresco(usuario.id, this.tokens.nuevaFamilia(), datos);
    return { resultado: await this.armarRespuesta(usuario), refresh };
  }

  // ─────────────────────────────── Refresco ─────────────────────────────────

  async refrescar(token: string, datos: DatosPeticion) {
    const hash = this.tokens.hash(token);
    const fila = await this.prisma.refreshToken.findUnique({ where: { tokenHash: hash } });

    if (!fila) throw new UnauthorizedException('Sesión inválida');

    // Reutilización de un token ya rotado: se asume robo y cae toda la familia.
    if (fila.usadoEn || fila.revocadoEn) {
      await this.prisma.refreshToken.updateMany({
        where: { familiaId: fila.familiaId, revocadoEn: null },
        data: { revocadoEn: new Date() },
      });
      await this.auditoria.registrar({
        usuarioId: fila.usuarioId,
        accion: 'sesion.reutilizacion',
        entidad: 'usuario',
        entidadId: fila.usuarioId,
        resumen: 'Se reutilizó un token de refresco ya rotado; se cerraron todas las sesiones',
        ip: datos.ip,
        nivel: 'warn',
      });
      throw new UnauthorizedException('Sesión inválida');
    }

    if (fila.expiraEn < new Date()) {
      throw new UnauthorizedException('La sesión venció');
    }

    await this.prisma.refreshToken.update({
      where: { id: fila.id },
      data: { usadoEn: new Date() },
    });

    const usuario = await this.prisma.usuario.findUnique({
      where: { id: fila.usuarioId },
      include: {
        rol: { include: { permisos: { include: { permiso: true } } } },
        permisos: { include: { permiso: true } },
        filial: true,
      },
    });

    if (!usuario || usuario.estado !== 'ACTIVO') {
      throw new UnauthorizedException('La cuenta no está activa');
    }

    const refresh = await this.emitirRefresco(usuario.id, fila.familiaId, datos);
    return { resultado: await this.armarRespuesta(usuario), refresh };
  }

  async cerrarSesion(token: string | undefined): Promise<void> {
    if (!token) return;
    const hash = this.tokens.hash(token);
    await this.prisma.refreshToken.updateMany({
      where: { tokenHash: hash, revocadoEn: null },
      data: { revocadoEn: new Date() },
    });
  }

  async cerrarTodasLasSesiones(usuarioId: string): Promise<void> {
    await this.prisma.refreshToken.updateMany({
      where: { usuarioId, revocadoEn: null },
      data: { revocadoEn: new Date() },
    });
  }

  // ──────────────────────── Activación e invitaciones ───────────────────────

  async verInvitacion(token: string) {
    const invitacion = await this.prisma.invitacion.findUnique({
      where: { tokenHash: this.tokens.hash(token) },
      include: { rol: true, filial: true },
    });

    if (!invitacion || invitacion.usadoEn || invitacion.revocadaEn) {
      throw new BadRequestException('La invitación no es válida o ya fue usada');
    }
    if (invitacion.expiraEn < new Date()) {
      throw new BadRequestException('La invitación venció. Pedí una nueva al administrador.');
    }

    return {
      nombre: invitacion.nombre,
      email: invitacion.email,
      rol: invitacion.rol.nombre,
      filial: invitacion.filial?.nombre ?? null,
    };
  }

  async activarCuenta(token: string, password: string, datos: DatosPeticion) {
    const problemas = validarContrasena(password);
    if (problemas.length > 0) {
      throw new BadRequestException(problemas.map((p) => p.mensaje).join(' '));
    }

    const hash = this.tokens.hash(token);
    const invitacion = await this.prisma.invitacion.findUnique({
      where: { tokenHash: hash },
      include: { rol: true },
    });

    if (!invitacion || invitacion.usadoEn || invitacion.revocadaEn) {
      throw new BadRequestException('La invitación no es válida o ya fue usada');
    }
    if (invitacion.expiraEn < new Date()) {
      throw new BadRequestException('La invitación venció. Pedí una nueva al administrador.');
    }

    const passwordHash = await argon2.hash(password, { type: argon2.argon2id });

    const usuario = await this.prisma.$transaction(async (tx) => {
      const existente = await tx.usuario.findUnique({ where: { email: invitacion.email } });

      const creado = existente
        ? await tx.usuario.update({
            where: { id: existente.id },
            data: {
              nombre: invitacion.nombre,
              passwordHash,
              rolId: invitacion.rolId,
              filialId: invitacion.filialId,
              estado: 'ACTIVO',
            },
          })
        : await tx.usuario.create({
            data: {
              email: invitacion.email,
              nombre: invitacion.nombre,
              passwordHash,
              rolId: invitacion.rolId,
              filialId: invitacion.filialId,
              estado: 'ACTIVO',
            },
          });

      await tx.invitacion.update({
        where: { id: invitacion.id },
        data: { usadoEn: new Date() },
      });

      return creado;
    });

    await this.auditoria.registrar({
      usuarioId: usuario.id,
      accion: 'cuenta.activada',
      entidad: 'usuario',
      entidadId: usuario.id,
      resumen: `Activó su cuenta con el rol ${invitacion.rol.nombre}`,
      ip: datos.ip,
    });

    return this.ingresarDirecto(usuario.id, datos);
  }

  // ─────────────────────── Recuperación de contraseña ───────────────────────

  async pedirReset(email: string, datos: DatosPeticion): Promise<void> {
    const usuario = await this.prisma.usuario.findUnique({
      where: { email: email.toLowerCase().trim() },
    });

    // Respondemos igual exista o no, para no revelar qué correos están dados de alta.
    if (!usuario || usuario.estado !== 'ACTIVO') {
      await this.retardoAntiEnumeracion();
      return;
    }

    const minutos = this.config.get('seguridad', { infer: true }).resetMinutos;
    const { token, hash } = this.tokens.generar();

    await this.prisma.resetPassword.create({
      data: {
        usuarioId: usuario.id,
        tokenHash: hash,
        expiraEn: new Date(Date.now() + minutos * 60_000),
      },
    });

    await this.correo.enviarReset(usuario.email, usuario.nombre, token, minutos);
    await this.auditoria.registrar({
      usuarioId: usuario.id,
      accion: 'password.reset.pedido',
      entidad: 'usuario',
      entidadId: usuario.id,
      resumen: 'Pidió restablecer su contraseña',
      ip: datos.ip,
    });
  }

  async restablecer(token: string, password: string, datos: DatosPeticion): Promise<void> {
    const problemas = validarContrasena(password);
    if (problemas.length > 0) {
      throw new BadRequestException(problemas.map((p) => p.mensaje).join(' '));
    }

    const fila = await this.prisma.resetPassword.findUnique({
      where: { tokenHash: this.tokens.hash(token) },
    });

    if (!fila || fila.usadoEn || fila.expiraEn < new Date()) {
      throw new BadRequestException('El enlace no es válido o ya venció');
    }

    const passwordHash = await argon2.hash(password, { type: argon2.argon2id });

    await this.prisma.$transaction([
      this.prisma.usuario.update({
        where: { id: fila.usuarioId },
        data: { passwordHash, intentosFallidos: 0, bloqueadoHasta: null },
      }),
      this.prisma.resetPassword.update({
        where: { id: fila.id },
        data: { usadoEn: new Date() },
      }),
      // Cambiar la contraseña cierra todas las sesiones abiertas.
      this.prisma.refreshToken.updateMany({
        where: { usuarioId: fila.usuarioId, revocadoEn: null },
        data: { revocadoEn: new Date() },
      }),
    ]);

    await this.auditoria.registrar({
      usuarioId: fila.usuarioId,
      accion: 'password.restablecida',
      entidad: 'usuario',
      entidadId: fila.usuarioId,
      resumen: 'Restableció su contraseña',
      ip: datos.ip,
    });
  }

  async cambiarPassword(usuarioId: string, actual: string, nueva: string): Promise<void> {
    const problemas = validarContrasena(nueva);
    if (problemas.length > 0) {
      throw new BadRequestException(problemas.map((p) => p.mensaje).join(' '));
    }

    const usuario = await this.prisma.usuario.findUnique({ where: { id: usuarioId } });
    if (!usuario?.passwordHash) throw new UnauthorizedException();

    const ok = await argon2.verify(usuario.passwordHash, actual);
    if (!ok) throw new BadRequestException('La contraseña actual no es correcta');

    await this.prisma.usuario.update({
      where: { id: usuarioId },
      data: { passwordHash: await argon2.hash(nueva, { type: argon2.argon2id }) },
    });

    await this.auditoria.registrar({
      usuarioId,
      accion: 'password.cambiada',
      entidad: 'usuario',
      entidadId: usuarioId,
      resumen: 'Cambió su contraseña',
    });
  }

  // ───────────────────────────── Auxiliares ─────────────────────────────────

  private async ingresarDirecto(usuarioId: string, datos: DatosPeticion) {
    const usuario = await this.prisma.usuario.findUniqueOrThrow({
      where: { id: usuarioId },
      include: {
        rol: { include: { permisos: { include: { permiso: true } } } },
        permisos: { include: { permiso: true } },
        filial: true,
      },
    });
    const refresh = await this.emitirRefresco(usuario.id, this.tokens.nuevaFamilia(), datos);
    return { resultado: await this.armarRespuesta(usuario), refresh };
  }

  private async emitirRefresco(
    usuarioId: string,
    familiaId: string,
    datos: DatosPeticion,
  ): Promise<string> {
    const dias = this.config.get('jwt', { infer: true }).expiraRefrescoDias;
    const { token, hash } = this.tokens.generar();

    await this.prisma.refreshToken.create({
      data: {
        usuarioId,
        tokenHash: hash,
        familiaId,
        expiraEn: new Date(Date.now() + dias * 86_400_000),
        ip: datos.ip,
        userAgent: datos.userAgent?.slice(0, 250),
      },
    });

    return token;
  }

  private async armarRespuesta(usuario: {
    id: string;
    email: string;
    nombre: string;
    totpHabilitado: boolean;
    rol: { slug: string; nombre: string; nivel: number; permisos: any[] };
    permisos: any[];
    filial: { id: string; nombre: string } | null;
  }): Promise<ResultadoIngreso> {
    const jwtCfg = this.config.get('jwt', { infer: true });

    const accessToken = await this.jwt.signAsync(
      { sub: usuario.id, tipo: 'acceso' },
      { expiresIn: jwtCfg.expiraAccesoSegundos },
    );

    const sesion: UsuarioSesion = {
      id: usuario.id,
      nombre: usuario.nombre,
      email: usuario.email,
      rol: {
        slug: usuario.rol.slug as UsuarioSesion['rol']['slug'],
        nombre: usuario.rol.nombre,
        nivel: usuario.rol.nivel,
      },
      filial: usuario.filial ? { id: usuario.filial.id, nombre: usuario.filial.nombre } : null,
      permisos: permisosEfectivos(usuario as never),
      totpHabilitado: usuario.totpHabilitado,
    };

    return { accessToken, expiraEn: jwtCfg.expiraAccesoSegundos, usuario: sesion };
  }

  /** Empareja el tiempo de respuesta para que no se pueda deducir si un correo existe. */
  private retardoAntiEnumeracion(): Promise<void> {
    return new Promise((r) => setTimeout(r, 220 + Math.random() * 120));
  }
}
