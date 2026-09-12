/**
 * Circuito editorial de una novedad.
 *
 *                  ┌──────────┐
 *                  │ BORRADOR │ ◀──────────────┐
 *                  └────┬─────┘                │
 *          envía        │                      │ corrige
 *                       ▼                      │
 *               ┌──────────────┐               │
 *               │ EN_REVISION  │               │
 *               └──┬────────┬──┘               │
 *        aprueba   │        │  pide cambios    │
 *                  ▼        ▼                  │
 *          ┌───────────┐  ┌─────────────────┐  │
 *          │ PUBLICADA │  │ CAMBIOS_PEDIDOS │──┘
 *          └─────┬─────┘  └────────┬────────┘
 *                │ archiva         │ desiste
 *                ▼                 ▼
 *          ┌───────────┐     ┌───────────┐
 *          │ ARCHIVADA │     │ CANCELADA │
 *          └───────────┘     └───────────┘
 */
export const ESTADO_NOVEDAD = {
  BORRADOR: 'BORRADOR',
  EN_REVISION: 'EN_REVISION',
  CAMBIOS_PEDIDOS: 'CAMBIOS_PEDIDOS',
  PUBLICADA: 'PUBLICADA',
  ARCHIVADA: 'ARCHIVADA',
  CANCELADA: 'CANCELADA',
} as const;

export type EstadoNovedad = (typeof ESTADO_NOVEDAD)[keyof typeof ESTADO_NOVEDAD];

export const ETIQUETA_ESTADO: Record<EstadoNovedad, string> = {
  BORRADOR: 'Borrador',
  EN_REVISION: 'En revisión',
  CAMBIOS_PEDIDOS: 'Cambios pedidos',
  PUBLICADA: 'Publicada',
  ARCHIVADA: 'Archivada',
  CANCELADA: 'Cancelada',
};

/** Transiciones permitidas. Lo que no está acá, no se puede hacer. */
export const TRANSICIONES: Record<EstadoNovedad, readonly EstadoNovedad[]> = {
  BORRADOR: [ESTADO_NOVEDAD.EN_REVISION, ESTADO_NOVEDAD.PUBLICADA, ESTADO_NOVEDAD.CANCELADA],
  EN_REVISION: [ESTADO_NOVEDAD.PUBLICADA, ESTADO_NOVEDAD.CAMBIOS_PEDIDOS, ESTADO_NOVEDAD.CANCELADA],
  CAMBIOS_PEDIDOS: [ESTADO_NOVEDAD.EN_REVISION, ESTADO_NOVEDAD.CANCELADA],
  PUBLICADA: [ESTADO_NOVEDAD.ARCHIVADA],
  ARCHIVADA: [ESTADO_NOVEDAD.PUBLICADA],
  CANCELADA: [ESTADO_NOVEDAD.BORRADOR],
};

export const puedeTransicionar = (desde: EstadoNovedad, hacia: EstadoNovedad): boolean =>
  TRANSICIONES[desde].includes(hacia);

/** Estados en los que el autor todavía puede editar el contenido. */
export const ESTADOS_EDITABLES: readonly EstadoNovedad[] = [
  ESTADO_NOVEDAD.BORRADOR,
  ESTADO_NOVEDAD.CAMBIOS_PEDIDOS,
];

export const esEditable = (estado: EstadoNovedad): boolean => ESTADOS_EDITABLES.includes(estado);

/**
 * Límites del resumen que va al carrusel de la portada.
 * Están replicados como restricción en la base: el diseño del slide se rompe
 * si el texto los supera, así que no alcanza con validarlo en el formulario.
 */
export const LIMITES_CARRUSEL = {
  VOLANTA: 24,
  TITULO: 42,
  BAJADA: 140,
} as const;

/** Proporción del recorte de la imagen del slide, definida por el diseño. */
export const RELACION_IMAGEN_CARRUSEL = 4 / 3;

export const ACCION_REVISION = {
  APROBADA: 'APROBADA',
  CAMBIOS_PEDIDOS: 'CAMBIOS_PEDIDOS',
} as const;

export type AccionRevision = (typeof ACCION_REVISION)[keyof typeof ACCION_REVISION];
