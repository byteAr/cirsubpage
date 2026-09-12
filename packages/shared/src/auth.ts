import type { Alcance, Permiso } from './permisos';
import type { RolSlug } from './roles';

export type EstadoUsuario = 'INVITADO' | 'ACTIVO' | 'SUSPENDIDO';

export interface UsuarioSesion {
  readonly id: string;
  readonly nombre: string;
  readonly email: string;
  readonly rol: { readonly slug: RolSlug; readonly nombre: string; readonly nivel: number };
  readonly filial: { readonly id: string; readonly nombre: string } | null;
  readonly permisos: readonly { readonly permiso: Permiso; readonly alcance: Alcance }[];
  readonly totpHabilitado: boolean;
}

export interface RespuestaIngreso {
  readonly accessToken: string;
  readonly expiraEn: number;
  readonly usuario: UsuarioSesion;
}

/** Requiere un segundo factor antes de emitir el token. */
export interface RespuestaSegundoFactor {
  readonly requiereTotp: true;
  readonly desafio: string;
}

export type ResultadoIngreso = RespuestaIngreso | RespuestaSegundoFactor;

export const requiereSegundoFactor = (r: ResultadoIngreso): r is RespuestaSegundoFactor =>
  'requiereTotp' in r;

/** Reglas de contraseña, iguales en el formulario y en el servidor. */
export const REGLAS_CONTRASENA = {
  MIN: 10,
  MAX: 128,
  REQUIERE_MAYUSCULA: true,
  REQUIERE_MINUSCULA: true,
  REQUIERE_NUMERO: true,
} as const;

export interface ProblemaContrasena {
  readonly codigo: 'corta' | 'larga' | 'sin-mayuscula' | 'sin-minuscula' | 'sin-numero';
  readonly mensaje: string;
}

export function validarContrasena(valor: string): ProblemaContrasena[] {
  const problemas: ProblemaContrasena[] = [];
  if (valor.length < REGLAS_CONTRASENA.MIN) {
    problemas.push({
      codigo: 'corta',
      mensaje: `Debe tener al menos ${REGLAS_CONTRASENA.MIN} caracteres.`,
    });
  }
  if (valor.length > REGLAS_CONTRASENA.MAX) {
    problemas.push({ codigo: 'larga', mensaje: 'Es demasiado larga.' });
  }
  if (REGLAS_CONTRASENA.REQUIERE_MAYUSCULA && !/[A-ZÁÉÍÓÚÑ]/.test(valor)) {
    problemas.push({ codigo: 'sin-mayuscula', mensaje: 'Falta al menos una mayúscula.' });
  }
  if (REGLAS_CONTRASENA.REQUIERE_MINUSCULA && !/[a-záéíóúñ]/.test(valor)) {
    problemas.push({ codigo: 'sin-minuscula', mensaje: 'Falta al menos una minúscula.' });
  }
  if (REGLAS_CONTRASENA.REQUIERE_NUMERO && !/[0-9]/.test(valor)) {
    problemas.push({ codigo: 'sin-numero', mensaje: 'Falta al menos un número.' });
  }
  return problemas;
}

/** Fortaleza aproximada, solo para el medidor visual del formulario. */
export function fortalezaContrasena(valor: string): 0 | 1 | 2 | 3 | 4 {
  if (!valor) return 0;
  let puntos = 0;
  if (valor.length >= 10) puntos++;
  if (valor.length >= 14) puntos++;
  if (/[A-ZÁÉÍÓÚÑ]/.test(valor) && /[a-záéíóúñ]/.test(valor)) puntos++;
  if (/[0-9]/.test(valor)) puntos++;
  if (/[^A-Za-z0-9]/.test(valor)) puntos++;
  return Math.min(4, puntos) as 0 | 1 | 2 | 3 | 4;
}
