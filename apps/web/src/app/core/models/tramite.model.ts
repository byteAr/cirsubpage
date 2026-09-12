/**
 * Trámite que el socio puede iniciar online
 */
import { IconoServicio } from './servicio.model';

export interface Tramite {
  readonly id: string;
  readonly titulo: string;
  readonly descripcion?: string;
  readonly icono?: IconoServicio;
  readonly imagen?: string;
  readonly ruta: string;
}
