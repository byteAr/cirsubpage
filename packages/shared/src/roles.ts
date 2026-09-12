import { Alcance, PERMISOS, Permiso, TODOS_LOS_PERMISOS } from './permisos';

export const ROLES = {
  SUPERADMIN: 'superadmin',
  ADMIN_USUARIOS: 'admin-usuarios',
  EDITOR_NOVEDADES: 'editor-novedades',
  REFERENTE_FILIAL: 'referente-filial',
  PRENSA: 'prensa',
  LECTURA: 'lectura',
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

const propio = (...permisos: Permiso[]) =>
  permisos.map((permiso) => ({ permiso, alcance: 'propio' as const }));

export const DEFINICIONES_ROLES: readonly DefinicionRol[] = [
  {
    slug: ROLES.SUPERADMIN,
    nombre: 'Superadministrador',
    descripcion: 'Control total del panel, incluidos usuarios, permisos y auditoría.',
    nivel: 0,
    permisos: TODOS_LOS_PERMISOS.map((permiso) => ({ permiso, alcance: 'todos' as const })),
    puedeAsignar: [
      ROLES.ADMIN_USUARIOS,
      ROLES.EDITOR_NOVEDADES,
      ROLES.REFERENTE_FILIAL,
      ROLES.PRENSA,
      ROLES.LECTURA,
    ],
    requiereFilial: false,
  },
  {
    slug: ROLES.ADMIN_USUARIOS,
    nombre: 'Administrador de usuarios',
    descripcion: 'Da de alta referentes de filial y administra sus accesos.',
    nivel: 10,
    permisos: [
      ...todos(
        PERMISOS.TABLERO_VER,
        PERMISOS.USUARIOS_INVITAR,
        PERMISOS.USUARIOS_ADMINISTRAR,
        PERMISOS.AUDITORIA_VER,
      ),
    ],
    puedeAsignar: [ROLES.REFERENTE_FILIAL],
    requiereFilial: false,
  },
  {
    slug: ROLES.EDITOR_NOVEDADES,
    nombre: 'Editor de novedades',
    descripcion:
      'Revisa lo que envían los referentes, aprueba o rechaza, publica y administra el carrusel.',
    nivel: 20,
    permisos: [
      ...todos(
        PERMISOS.TABLERO_VER,
        PERMISOS.NOVEDADES_CREAR,
        PERMISOS.NOVEDADES_ENVIAR,
        PERMISOS.NOVEDADES_REVISAR,
        PERMISOS.NOVEDADES_PUBLICAR,
        PERMISOS.NOVEDADES_ELIMINAR,
        PERMISOS.CARRUSEL_EDITAR,
        PERMISOS.MEDIOS_SUBIR,
        PERMISOS.MEDIOS_ELIMINAR,
      ),
    ],
    puedeAsignar: [],
    requiereFilial: false,
  },
  {
    slug: ROLES.PRENSA,
    nombre: 'Prensa',
    descripcion:
      'Crea y publica novedades de sede central sin pasar por revisión. Edita contenido institucional.',
    nivel: 30,
    permisos: [
      ...todos(
        PERMISOS.TABLERO_VER,
        PERMISOS.NOVEDADES_CREAR,
        PERMISOS.NOVEDADES_ENVIAR,
        PERMISOS.NOVEDADES_PUBLICAR,
        PERMISOS.CARRUSEL_EDITAR,
        PERMISOS.MEDIOS_SUBIR,
        PERMISOS.AUTORIDADES_EDITAR,
        PERMISOS.CONTACTOS_EDITAR,
        PERMISOS.PAGINAS_EDITAR,
      ),
    ],
    puedeAsignar: [],
    requiereFilial: false,
  },
  {
    slug: ROLES.REFERENTE_FILIAL,
    nombre: 'Referente de filial',
    descripcion:
      'Crea novedades de su filial y las envía a revisión. Edita la ficha de su propia filial.',
    nivel: 40,
    permisos: [
      ...todos(PERMISOS.TABLERO_VER),
      ...propio(
        PERMISOS.NOVEDADES_CREAR,
        PERMISOS.NOVEDADES_ENVIAR,
        PERMISOS.MEDIOS_SUBIR,
        PERMISOS.FILIALES_EDITAR,
      ),
    ],
    puedeAsignar: [],
    requiereFilial: true,
  },
  {
    slug: ROLES.LECTURA,
    nombre: 'Solo lectura',
    descripcion: 'Consulta el tablero y la auditoría. No modifica nada.',
    nivel: 90,
    permisos: [...todos(PERMISOS.TABLERO_VER, PERMISOS.AUDITORIA_VER)],
    puedeAsignar: [],
    requiereFilial: false,
  },
];

export const definicionRol = (slug: string): DefinicionRol | undefined =>
  DEFINICIONES_ROLES.find((r) => r.slug === slug);
