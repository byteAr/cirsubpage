/**
 * Servicio o beneficio ofrecido por la mutual
 */
export interface Servicio {
  readonly id: string;
  readonly titulo: string;
  readonly descripcion?: string;
  /** Nombre del ícono (usado por `app-icon-illustration`). Si está presente, tiene prioridad sobre `imagen`. */
  readonly icono?: IconoServicio;
  /** Fallback raster si no hay ícono. */
  readonly imagen?: string;
  readonly ruta: string;
}

export type IconoServicio =
  // Servicios
  | 'asesoramiento-contable'
  | 'asesoramiento-juridico'
  | 'bodas-de-oro'
  | 'subsidio-casamiento'
  | 'subsidio-hijos'
  | 'subsidio-sepelio'
  | 'turismo'
  | 'farmacia'
  | 'evacuacion'
  // Trámites
  | 'afiliacion'
  | 'actualizacion-datos'
  | 'alta-familiar'
  // Nosotros
  | 'institucional'
  | 'autoridades'
  // Recibos
  | 'retirados'
  | 'actividad'
  // Departamentos de contacto
  | 'hotel'
  | 'bienestar'
  | 'comunicacion'
  | 'electoral'
  | 'fiscalizadora'
  | 'presidencia'
  | 'presupuesto'
  | 'protocolo'
  | 'recepcion'
  | 'rrhh'
  | 'secretaria';
