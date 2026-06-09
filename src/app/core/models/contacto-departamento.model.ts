import { IconoServicio } from './servicio.model';

/**
 * Representa un departamento de contacto de la mutual
 */
export interface ContactoDepartamento {
  readonly nombre: string;
  readonly email: string;
  readonly telefono?: string;
  readonly interno?: string;
  readonly icono: IconoServicio;
}
