import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  SetMetadata,
  UnauthorizedException,
  createParamDecorator,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Alcance, Permiso } from '@cirsub/shared';

export const CLAVE_PERMISOS = 'cirsub:permisos';

/**
 * Exige uno o más permisos sobre un controlador o un método.
 * Basta con tener uno de los listados.
 */
export const RequierePermiso = (...permisos: Permiso[]) => SetMetadata(CLAVE_PERMISOS, permisos);

export interface UsuarioPeticion {
  id: string;
  email: string;
  nombre: string;
  rolSlug: string;
  rolNivel: number;
  filialId: string | null;
  permisos: { permiso: string; alcance: Alcance }[];
}

export const UsuarioActual = createParamDecorator(
  (_dato: unknown, ctx: ExecutionContext): UsuarioPeticion => {
    const req = ctx.switchToHttp().getRequest<{ usuario?: UsuarioPeticion }>();
    if (!req.usuario) {
      throw new UnauthorizedException('Sesión no encontrada');
    }
    return req.usuario;
  },
);

@Injectable()
export class PermisosGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(contexto: ExecutionContext): boolean {
    const requeridos = this.reflector.getAllAndOverride<Permiso[] | undefined>(CLAVE_PERMISOS, [
      contexto.getHandler(),
      contexto.getClass(),
    ]);

    if (!requeridos || requeridos.length === 0) return true;

    const req = contexto.switchToHttp().getRequest<{ usuario?: UsuarioPeticion }>();
    const usuario = req.usuario;
    if (!usuario) throw new UnauthorizedException('Necesitás iniciar sesión');

    const tiene = requeridos.some((p) => usuario.permisos.some((up) => up.permiso === p));
    if (!tiene) {
      throw new ForbiddenException('No tenés permiso para esta acción');
    }

    return true;
  }
}

/**
 * Devuelve el alcance con el que el usuario tiene un permiso, o null si no lo tiene.
 * Los servicios lo usan para decidir si filtran por filial.
 */
export const alcanceDe = (usuario: UsuarioPeticion, permiso: Permiso): Alcance | null =>
  usuario.permisos.find((p) => p.permiso === permiso)?.alcance ?? null;

/** Lanza si el usuario tiene el permiso con alcance propio y el recurso es de otra filial. */
export function verificarAlcance(
  usuario: UsuarioPeticion,
  permiso: Permiso,
  filialIdRecurso: string | null,
): void {
  const alcance = alcanceDe(usuario, permiso);
  if (alcance === null) throw new ForbiddenException('No tenés permiso para esta acción');
  if (alcance === 'todos') return;
  if (!usuario.filialId || usuario.filialId !== filialIdRecurso) {
    throw new ForbiddenException('Solo podés trabajar sobre el contenido de tu filial');
  }
}
