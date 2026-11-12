import {
  Alcance,
  FUNCION_USUARIO,
  FuncionUsuario,
  PERMISOS,
  Permiso,
  TODOS_LOS_PERMISOS,
} from './permisos';

export const ROLES = {
  SUPERADMIN: 'superadmin',
  COORDINADOR: 'coordinador',
  ADMIN: 'admin',
  USUARIO: 'usuario',
} as const;

export type RolSlug = (typeof ROLES)[keyof typeof ROLES];

export interface DefinicionRol {
  readonly slug: RolSlug;
  readonly nombre: string;
  readonly descripcion: string;
  /**
   * Cuanto más bajo el nivel, más poder. Nadie puede invitar a un rol de nivel
   * menor o igual al propio: es lo que impide que un administrador de usuarios
   * se fabrique un superadministrador.
   */
  readonly nivel: number;
  readonly permisos: readonly { readonly permiso: Permiso; readonly alcance: Alcance }[];
  /** Roles que este rol puede asignar al invitar. */
  readonly puedeAsignar: readonly RolSlug[];
  /** Un referente sin filial asignada no tiene sobre qué trabajar. */
  readonly requiereFilial: boolean;
}

const todos = (...permisos: Permiso[]) =>
  permisos.map((permiso) => ({ permiso, alcance: 'todos' as const }));

export const DEFINICIONES_ROLES: readonly DefinicionRol[] = [
  {
    slug: ROLES.SUPERADMIN,
    nombre: 'Superadministrador',
    descripcion: 'Control total del panel. Es una sola cuenta y su contraseña vive en el .env.',
    nivel: 0,
    permisos: todos(...TODOS_LOS_PERMISOS),
    puedeAsignar: [ROLES.COORDINADOR, ROLES.ADMIN, ROLES.USUARIO],
    requiereFilial: false,
  },
  {
    slug: ROLES.COORDINADOR,
    nombre: 'Coordinador',
    descripcion:
      'Lo mismo que el superadministrador, salvo tocar su cuenta: designa administradores y usuarios y aprueba lo que cargan.',
    nivel: 5,
    permisos: todos(...TODOS_LOS_PERMISOS),
    puedeAsignar: [ROLES.ADMIN, ROLES.USUARIO],
    requiereFilial: false,
  },
  {
    slug: ROLES.ADMIN,
    nombre: 'Administrador',
    descripcion:
      'Crea usuarios, define qué puede hacer cada uno y aprueba lo que cargan. Sus propios cambios se publican directo.',
    nivel: 10,
    permisos: todos(...TODOS_LOS_PERMISOS),
    puedeAsignar: [ROLES.USUARIO],
    requiereFilial: false,
  },
  {
    slug: ROLES.USUARIO,
    nombre: 'Usuario',
    descripcion:
      'Solo ve lo que su administrador le habilitó, y todo lo que cambia espera aprobación.',
    nivel: 50,
    // Todo se le agrega por usuario con FUNCIONES_USUARIO. Sin tablero propio:
    // quien mantiene una filial o el simulador entra directo a lo suyo.
    permisos: [],
    puedeAsignar: [],
    requiereFilial: false,
  },
];

/** Roles de la primera versión del panel y a qué rol pasan sus cuentas. */
export const ROLES_ANTERIORES: Readonly<
  Record<string, { readonly rol: RolSlug; readonly funciones: readonly FuncionUsuario[] }>
> = {
  'admin-usuarios': { rol: ROLES.ADMIN, funciones: [] },
  'editor-novedades': { rol: ROLES.ADMIN, funciones: [] },
  prensa: { rol: ROLES.USUARIO, funciones: [FUNCION_USUARIO.NOVEDADES] },
  'referente-filial': {
    rol: ROLES.USUARIO,
    funciones: [FUNCION_USUARIO.NOVEDADES, FUNCION_USUARIO.FILIAL],
  },
  lectura: { rol: ROLES.USUARIO, funciones: [] },
};

/** Quienes aprueban lo que cargan los usuarios y reciben los avisos de la bandeja. */
export const ROLES_APROBADORES: readonly RolSlug[] = [ROLES.SUPERADMIN, ROLES.COORDINADOR, ROLES.ADMIN];

export const definicionRol = (slug: string): DefinicionRol | undefined =>
  DEFINICIONES_ROLES.find((r) => r.slug === slug);
