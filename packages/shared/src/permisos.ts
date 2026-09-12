/**
 * Catálogo de permisos del panel.
 *
 * Es la única fuente de verdad: la API los usa para proteger rutas y el
 * frontend para decidir qué muestra. Si un permiso no está acá, no existe.
 */

export const PERMISOS = {
  TABLERO_VER: 'tablero.ver',

  NOVEDADES_CREAR: 'novedades.crear',
  NOVEDADES_ENVIAR: 'novedades.enviar',
  NOVEDADES_REVISAR: 'novedades.revisar',
  NOVEDADES_PUBLICAR: 'novedades.publicar',
  NOVEDADES_ELIMINAR: 'novedades.eliminar',

  CARRUSEL_EDITAR: 'carrusel.editar',
  MEDIOS_SUBIR: 'medios.subir',
  MEDIOS_ELIMINAR: 'medios.eliminar',

  FILIALES_EDITAR: 'filiales.editar',
  AUTORIDADES_EDITAR: 'autoridades.editar',
  CONTACTOS_EDITAR: 'contactos.editar',
  PAGINAS_EDITAR: 'paginas.editar',

  USUARIOS_INVITAR: 'usuarios.invitar',
  USUARIOS_ADMINISTRAR: 'usuarios.administrar',
  AUDITORIA_VER: 'auditoria.ver',
} as const;

export type Permiso = (typeof PERMISOS)[keyof typeof PERMISOS];

export const TODOS_LOS_PERMISOS: readonly Permiso[] = Object.values(PERMISOS);

/**
 * Alcance de un permiso.
 *
 * `todos`  → sobre cualquier registro.
 * `propio` → solo sobre los registros de la filial del usuario, o creados por él.
 */
export type Alcance = 'todos' | 'propio';

export interface PermisoAsignado {
  readonly permiso: Permiso;
  readonly alcance: Alcance;
}

/** Agrupación de permisos por módulo, para dibujar la matriz del panel. */
export const MODULOS_PERMISOS: readonly {
  readonly id: string;
  readonly nombre: string;
  readonly permisos: readonly { readonly permiso: Permiso; readonly etiqueta: string }[];
}[] = [
  {
    id: 'general',
    nombre: 'General',
    permisos: [{ permiso: PERMISOS.TABLERO_VER, etiqueta: 'Ver el tablero' }],
  },
  {
    id: 'novedades',
    nombre: 'Novedades',
    permisos: [
      { permiso: PERMISOS.NOVEDADES_CREAR, etiqueta: 'Crear novedades' },
      { permiso: PERMISOS.NOVEDADES_ENVIAR, etiqueta: 'Enviar a revisión' },
      { permiso: PERMISOS.NOVEDADES_REVISAR, etiqueta: 'Revisar y aprobar' },
      { permiso: PERMISOS.NOVEDADES_PUBLICAR, etiqueta: 'Publicar sin revisión' },
      { permiso: PERMISOS.NOVEDADES_ELIMINAR, etiqueta: 'Eliminar novedades' },
      { permiso: PERMISOS.CARRUSEL_EDITAR, etiqueta: 'Editar el carrusel' },
    ],
  },
  {
    id: 'medios',
    nombre: 'Medios',
    permisos: [
      { permiso: PERMISOS.MEDIOS_SUBIR, etiqueta: 'Subir archivos' },
      { permiso: PERMISOS.MEDIOS_ELIMINAR, etiqueta: 'Eliminar archivos' },
    ],
  },
  {
    id: 'institucional',
    nombre: 'Institucional',
    permisos: [
      { permiso: PERMISOS.FILIALES_EDITAR, etiqueta: 'Editar fichas de filial' },
      { permiso: PERMISOS.AUTORIDADES_EDITAR, etiqueta: 'Editar autoridades' },
      { permiso: PERMISOS.CONTACTOS_EDITAR, etiqueta: 'Editar contactos' },
      { permiso: PERMISOS.PAGINAS_EDITAR, etiqueta: 'Editar servicios y trámites' },
    ],
  },
  {
    id: 'administracion',
    nombre: 'Administración',
    permisos: [
      { permiso: PERMISOS.USUARIOS_INVITAR, etiqueta: 'Invitar usuarios' },
      { permiso: PERMISOS.USUARIOS_ADMINISTRAR, etiqueta: 'Administrar usuarios' },
      { permiso: PERMISOS.AUDITORIA_VER, etiqueta: 'Ver auditoría' },
    ],
  },
];
