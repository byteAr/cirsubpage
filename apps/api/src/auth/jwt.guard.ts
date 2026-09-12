import {
  CanActivate,
  ExecutionContext,
  Injectable,
  SetMetadata,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import type { Request } from 'express';
import { PrismaService } from '../prisma/prisma.service';
import type { UsuarioPeticion } from '../comun/permisos.guard';
import { permisosEfectivos } from './permisos-efectivos';

export const CLAVE_PUBLICO = 'cirsub:publico';

/** Marca una ruta como abierta, sin sesión. */
export const Publico = () => SetMetadata(CLAVE_PUBLICO, true);

interface CargaToken {
  sub: string;
  tipo: 'acceso';
}

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly jwt: JwtService,
    private readonly prisma: PrismaService,
  ) {}

  async canActivate(contexto: ExecutionContext): Promise<boolean> {
    const esPublico = this.reflector.getAllAndOverride<boolean>(CLAVE_PUBLICO, [
      contexto.getHandler(),
      contexto.getClass(),
    ]);
    if (esPublico) return true;

    const req = contexto.switchToHttp().getRequest<Request & { usuario?: UsuarioPeticion }>();
    const cabecera = req.headers.authorization;
    if (!cabecera?.startsWith('Bearer ')) {
      throw new UnauthorizedException('Falta el token de acceso');
    }

    let carga: CargaToken;
    try {
      carga = await this.jwt.verifyAsync<CargaToken>(cabecera.slice(7));
    } catch {
      throw new UnauthorizedException('Token inválido o vencido');
    }
    if (carga.tipo !== 'acceso') throw new UnauthorizedException('Token inválido');

    const usuario = await this.prisma.usuario.findUnique({
      where: { id: carga.sub },
      include: {
        rol: { include: { permisos: { include: { permiso: true } } } },
        permisos: { include: { permiso: true } },
        filial: true,
      },
    });

    if (!usuario || usuario.estado !== 'ACTIVO') {
      throw new UnauthorizedException('La cuenta no está activa');
    }

    req.usuario = {
      id: usuario.id,
      email: usuario.email,
      nombre: usuario.nombre,
      rolSlug: usuario.rol.slug,
      rolNivel: usuario.rol.nivel,
      filialId: usuario.filialId,
      permisos: permisosEfectivos(usuario),
    };

    return true;
  }
}
