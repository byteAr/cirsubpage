import { Injectable } from '@angular/core';
import { Servicio, Tramite } from '../models';

@Injectable({ providedIn: 'root' })
export class ServiciosService {
  private readonly servicios: readonly Servicio[] = [
    { id: 'asesoramiento-contable', titulo: 'Asesoramiento Contable', icono: 'asesoramiento-contable', ruta: '/servicios/asesoramiento-contable' },
    { id: 'asesoramiento-juridico', titulo: 'Asesoramiento Jurídico', icono: 'asesoramiento-juridico', ruta: '/servicios/asesoramiento-juridico' },
    { id: 'bodas-de-oro', titulo: 'Beneficios Bodas de Oro', icono: 'bodas-de-oro', ruta: '/servicios/bodas-de-oro' },
    { id: 'subsidio-casamiento', titulo: 'Subsidio por Casamiento', icono: 'subsidio-casamiento', ruta: '/servicios/subsidio-casamiento' },
    { id: 'subsidio-hijos', titulo: 'Subsidio por Hijo', icono: 'subsidio-hijos', ruta: '/servicios/subsidio-hijos' },
    { id: 'subsidio-sepelio', titulo: 'Subsidio por Sepelio', icono: 'subsidio-sepelio', ruta: '/servicios/subsidio-sepelio' },
    { id: 'turismo', titulo: 'Turismo', icono: 'turismo', ruta: '/servicios/turismo' },
    { id: 'farmacia', titulo: 'Farmacia', icono: 'farmacia', ruta: '/servicios/farmacia' },
    { id: 'evacuacion', titulo: 'Evacuación', icono: 'evacuacion', ruta: '/servicios/evacuacion' },
  ];

  private readonly tramites: readonly Tramite[] = [
    { id: 'afiliacion', titulo: 'Afiliación', descripcion: 'Asociate a la mutual y disfrutá de todos los beneficios.', icono: 'afiliacion', ruta: '/tramites/afiliacion' },
    { id: 'actualizacion-datos', titulo: 'Actualización de datos', descripcion: 'Mantené tus datos personales al día.', icono: 'actualizacion-datos', ruta: '/tramites/actualizacion-datos' },
    { id: 'alta-familiar', titulo: 'Alta Familiar', descripcion: 'Sumá familiares directos a tu cobertura.', icono: 'alta-familiar', ruta: '/tramites/alta-familiar' },
  ];

  getServicios(): readonly Servicio[] {
    return this.servicios;
  }

  getTramites(): readonly Tramite[] {
    return this.tramites;
  }
}
