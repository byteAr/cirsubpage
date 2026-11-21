import type { IconoServicio } from '../../../../core/models';

/**
 * Los íconos que se pueden elegir para un servicio. El nombre es el uso para el
 * que se dibujó cada uno; el selector muestra el dibujo al lado.
 *
 * Son los dibujos de `app-icon-illustration`: si se suma uno allá, hay que
 * sumarlo acá para que aparezca en el selector.
 */
export const ICONOS_SERVICIO: readonly { readonly id: IconoServicio; readonly nombre: string }[] = [
  { id: 'bodas-de-oro', nombre: 'Bodas de Oro' },
  { id: 'subsidio-casamiento', nombre: 'Casamiento' },
  { id: 'subsidio-hijos', nombre: 'Hijos' },
  { id: 'subsidio-sepelio', nombre: 'Sepelio' },
  { id: 'turismo', nombre: 'Turismo' },
  { id: 'farmacia', nombre: 'Farmacia' },
  { id: 'evacuacion', nombre: 'Evacuación' },
  { id: 'hotel', nombre: 'Hotel' },
  { id: 'bienestar', nombre: 'Bienestar' },
  { id: 'asesoramiento-contable', nombre: 'Asesoramiento contable' },
  { id: 'asesoramiento-juridico', nombre: 'Asesoramiento jurídico' },
  { id: 'afiliacion', nombre: 'Afiliación' },
  { id: 'actualizacion-datos', nombre: 'Actualización de datos' },
  { id: 'alta-familiar', nombre: 'Alta familiar' },
  { id: 'institucional', nombre: 'Institucional' },
  { id: 'comunicacion', nombre: 'Comunicación' },
  { id: 'retirados', nombre: 'Retirados' },
  { id: 'actividad', nombre: 'En actividad' },
  { id: 'presupuesto', nombre: 'Presupuesto' },
  { id: 'recepcion', nombre: 'Recepción' },
  { id: 'secretaria', nombre: 'Secretaría' },
];
