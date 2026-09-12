import {
  Body,
  Controller,
  Get,
  HttpCode,
  Post,
  Query,
  Req,
  Res,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Throttle } from '@nestjs/throttler';
import type { Request, Response } from 'express';
import { requiereSegundoFactor } from '@cirsub/shared';
import { AuthService } from './auth.service';
import { Publico } from './jwt.guard';
import {
  ActivarCuentaDto,
  CambiarPasswordDto,
  IngresarDto,
  PedirResetDto,
  RestablecerDto,
} from './dto/auth.dto';
import { UsuarioActual, type UsuarioPeticion } from '../comun/permisos.guard';
import type { Configuracion } from '../config/configuracion';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly auth: AuthService,
    private readonly config: ConfigService<Configuracion, true>,
  ) {}

  @Publico()
  @Throttle({ default: { limit: 8, ttl: 60_000 } })
  @Post('ingresar')
  @HttpCode(200)
  async ingresar(@Body() dto: IngresarDto, @Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const { resultado, refresh } = await this.auth.ingresar(
      dto.email,
      dto.password,
      dto.codigoTotp,
      this.datos(req),
    );

    if (!requiereSegundoFactor(resultado) && refresh) {
      this.ponerCookie(res, refresh);
    }
    return resultado;
  }

  @Publico()
  @Post('refrescar')
  @HttpCode(200)
  async refrescar(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const nombre = this.config.get('jwt', { infer: true }).cookieRefresco;
    const token = (req.cookies as Record<string, string> | undefined)?.[nombre];
    if (!token) throw new UnauthorizedException('No hay sesión');

    const { resultado, refresh } = await this.auth.refrescar(token, this.datos(req));
    if (refresh) this.ponerCookie(res, refresh);
    return resultado;
  }

  @Publico()
  @Post('salir')
  @HttpCode(204)
  async salir(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const nombre = this.config.get('jwt', { infer: true }).cookieRefresco;
    await this.auth.cerrarSesion((req.cookies as Record<string, string> | undefined)?.[nombre]);
    res.clearCookie(nombre, this.opcionesCookie());
  }

  @Publico()
  @Get('invitacion')
  verInvitacion(@Query('token') token: string) {
    return this.auth.verInvitacion(token);
  }

  @Publico()
  @Throttle({ default: { limit: 6, ttl: 60_000 } })
  @Post('activar')
  @HttpCode(200)
  async activar(
    @Body() dto: ActivarCuentaDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const { resultado, refresh } = await this.auth.activarCuenta(
      dto.token,
      dto.password,
      this.datos(req),
    );
    if (refresh) this.ponerCookie(res, refresh);
    return resultado;
  }

  @Publico()
  @Throttle({ default: { limit: 4, ttl: 300_000 } })
  @Post('recuperar')
  @HttpCode(202)
  async recuperar(@Body() dto: PedirResetDto, @Req() req: Request) {
    await this.auth.pedirReset(dto.email, this.datos(req));
    return { mensaje: 'Si el correo está registrado, te llega un enlace en unos minutos.' };
  }

  @Publico()
  @Throttle({ default: { limit: 6, ttl: 300_000 } })
  @Post('restablecer')
  @HttpCode(204)
  async restablecer(@Body() dto: RestablecerDto, @Req() req: Request) {
    await this.auth.restablecer(dto.token, dto.password, this.datos(req));
  }

  @Get('yo')
  yo(@UsuarioActual() usuario: UsuarioPeticion) {
    return usuario;
  }

  @Post('cambiar-password')
  @HttpCode(204)
  async cambiarPassword(
    @UsuarioActual() usuario: UsuarioPeticion,
    @Body() dto: CambiarPasswordDto,
  ) {
    await this.auth.cambiarPassword(usuario.id, dto.actual, dto.nueva);
  }

  @Post('cerrar-todas')
  @HttpCode(204)
  async cerrarTodas(@UsuarioActual() usuario: UsuarioPeticion) {
    await this.auth.cerrarTodasLasSesiones(usuario.id);
  }

  // ───────────────────────────── Auxiliares ───────────────────────────────

  private datos(req: Request) {
    return { ip: req.ip, userAgent: req.get('user-agent') ?? undefined };
  }

  private opcionesCookie() {
    const jwt = this.config.get('jwt', { infer: true });
    const produccion = this.config.get('produccion', { infer: true });
    return {
      httpOnly: true,
      secure: produccion,
      sameSite: 'lax' as const,
      domain: jwt.cookieDominio,
      path: '/',
    };
  }

  private ponerCookie(res: Response, token: string) {
    const jwt = this.config.get('jwt', { infer: true });
    res.cookie(jwt.cookieRefresco, token, {
      ...this.opcionesCookie(),
      maxAge: jwt.expiraRefrescoDias * 86_400_000,
    });
  }
}
