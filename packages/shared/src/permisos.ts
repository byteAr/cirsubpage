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
  SIMULADOR_EDITAR: 'simulador.editar',
  MEDIOS_SUBIR: 'medios.subir',
  MEDIOS_ELIMINAR: 'medios.eliminar',

  FILIALES_EDITAR: 'filiales.editar',
  AUTORIDADES_EDITAR: 'autoridades.editar',
  CONTACTOS_EDITAR: 'contactos.editar',
  PAGINAS_EDITAR: 'paginas.editar',

  /** Aprobar o rechazar lo que cargan los usuarios. Sin esto, todo cambio queda pendiente. */
  CAMBIOS_APROBAR: 'cambios.aprobar',

  /** Pedidos de eliminación de datos que llegan por la página pública. */
  BAJAS_GESTIONAR: 'bajas.gestionar',

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
      { permiso: PERMISOS.SIMULADOR_EDITAR, etiqueta: 'Editar el simulador de préstamos' },
    ],
  },
  {
    id: 'administracion',
    nombre: 'Administración',
    permisos: [
      { permiso: PERMISOS.CAMBIOS_APROBAR, etiqueta: 'Aprobar cambios' },
      { permiso: PERMISOS.BAJAS_GESTIONAR, etiqueta: 'Gestionar pedidos de baja de datos' },
      { permiso: PERMISOS.USUARIOS_INVITAR, etiqueta: 'Invitar usuarios' },
      { permiso: PERMISOS.USUARIOS_ADMINISTRAR, etiqueta: 'Administrar usuarios' },
      { permiso: PERMISOS.AUDITORIA_VER, etiqueta: 'Ver auditoría' },
    ],
  },
];

/**
 * Lo que un administrador le puede habilitar a un usuario.
 *
 * Se asignan funciones y no permisos sueltos: quien administra piensa en «le
 * dejo manejar el simulador», no en doce casilleros. Ninguna incluye publicar,
 * aprobar ni eliminar, así que nada de lo que cargue un usuario llega a la
 * página sin el visto bueno de un administrador.
 */
export const FUNCION_USUARIO = {
  NOVEDADES: 'novedades',
  SIMULADOR: 'simulador',
  FILIAL: 'filial',
} as const;

export type FuncionUsuario = (typeof FUNCION_USUARIO)[keyof typeof FUNCION_USUARIO];

export const FUNCIONES_USUARIO: readonly {
  readonly id: FuncionUsuario;
  readonly nombre: string;
  readonly descripcion: string;
  readonly requiereFilial: boolean;
  readonly permisos: readonly Permiso[];
}[] = [
  {
    id: FUNCION_USUARIO.NOVEDADES,
    nombre: 'Novedades y carrusel',
    descripcion: 'Redacta novedades y propone las que salen en el carrusel de la portada.',
    requiereFilial: false,
    permisos: [PERMISOS.NOVEDADES_CREAR, PERMISOS.NOVEDADES_ENVIAR, PERMISOS.MEDIOS_SUBIR],
  },
  {
    id: FUNCION_USUARIO.SIMULADOR,
    nombre: 'Simulador de préstamos',
    descripcion: 'Actualiza los planes y coeficientes del simulador.',
    requiereFilial: false,
    permisos: [PERMISOS.SIMULADOR_EDITAR],
  },
  {
    id: FUNCION_USUARIO.FILIAL,
    nombre: 'Datos de su filial',
    descripcion: 'Mantiene dirección, contactos, capacidad y convenios de su filial.',
    requiereFilial: true,
    permisos: [PERMISOS.FILIALES_EDITAR],
  },
];

const FUNCIONES_VALIDAS = new Set<string>(Object.values(FUNCION_USUARIO));

export const esFuncionValida = (valor: string): valor is FuncionUsuario =>
  FUNCIONES_VALIDAS.has(valor);

/**
 * Traduce funciones a permisos.
 *
 * Quien tiene filial trabaja con alcance propio: solo ve y toca lo de su filial.
 */
export function permisosDeFunciones(
  funciones: readonly string[],
  tieneFilial: boolean,
): PermisoAsignado[] {
  const mapa = new Map<Permiso, Alcance>();
  for (const f of FUNCIONES_USUARIO) {
    if (!funciones.includes(f.id)) continue;
    for (const permiso of f.permisos) {
      const alcance: Alcance =
        f.requiereFilial || (tieneFilial && f.id === FUNCION_USUARIO.NOVEDADES) ? 'propio' : 'todos';
      mapa.set(permiso, alcance);
    }
  }
  return [...mapa.entries()].map(([permiso, alcance]) => ({ permiso, alcance }));
}

/** La inversa: qué funciones tiene alguien según los permisos que le quedaron guardados. */
export function funcionesDePermisos(permisos: readonly string[]): FuncionUsuario[] {
  return FUNCIONES_USUARIO.filter((f) => f.permisos.every((p) => permisos.includes(p))).map(
    (f) => f.id,
  );
}
