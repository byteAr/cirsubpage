import { Routes } from '@angular/router';
import { INFO_PAGES } from '../../core/data/info-pages.data';

/**
 * Helper: genera un route entry para una página informativa basada en su key del registry.
 * Lazy-load del componente y `data.content` inyectado para el InfoPage genérico.
 */
const infoRoute = (path: string, key: keyof typeof INFO_PAGES, title: string) => ({
  path,
  title,
  loadComponent: () =>
    import('../../shared/components/info-page/info-page').then((m) => m.InfoPage),
  data: { content: INFO_PAGES[key] },
});

export const PUBLIC_ROUTES: Routes = [
  // Home
  {
    path: '',
    title: 'CIRSUB',
    loadComponent: () => import('./pages/home/home').then((m) => m.Home),
  },

  // Nosotros + sub-rutas
  {
    path: 'nosotros',
    title: 'Nosotros',
    loadComponent: () => import('./pages/nosotros/nosotros').then((m) => m.Nosotros),
  },
  {
    path: 'nosotros/institucional',
    title: 'Institucional',
    loadComponent: () =>
      import('./pages/nosotros/institucional/institucional').then((m) => m.Institucional),
  },
  {
    path: 'nosotros/autoridades',
    title: 'Autoridades',
    loadComponent: () =>
      import('./pages/nosotros/autoridades/autoridades').then((m) => m.Autoridades),
  },

  // Servicios (landing existente reutilizada)
  {
    path: 'beneficios',
    title: 'Servicios',
    loadComponent: () => import('./pages/beneficios/beneficios').then((m) => m.Beneficios),
  },
  infoRoute('servicios/asesoramiento-contable', 'asesoramiento-contable', 'Asesoramiento Contable'),
  infoRoute('servicios/asesoramiento-juridico', 'asesoramiento-juridico', 'Asesoramiento Jurídico'),
  infoRoute('servicios/bodas-de-oro', 'bodas-de-oro', 'Bodas de Oro'),
  infoRoute('servicios/subsidio-casamiento', 'subsidio-casamiento', 'Subsidio por Casamiento'),
  infoRoute('servicios/subsidio-hijos', 'subsidio-hijos', 'Subsidio por Hijo'),
  infoRoute('servicios/subsidio-sepelio', 'subsidio-sepelio', 'Subsidio por Sepelio'),
  infoRoute('servicios/turismo', 'turismo', 'Turismo'),
  infoRoute('servicios/farmacia', 'farmacia', 'Farmacia'),
  infoRoute('servicios/evacuacion', 'evacuacion', 'Evacuación'),

  // Trámites + sub-rutas
  {
    path: 'tramites',
    title: 'Trámites',
    loadComponent: () => import('./pages/tramites/tramites').then((m) => m.Tramites),
  },
  infoRoute('tramites/afiliacion', 'afiliacion', 'Afiliación'),
  infoRoute('tramites/actualizacion-datos', 'actualizacion-datos', 'Actualización de Datos'),
  infoRoute('tramites/alta-familiar', 'alta-familiar', 'Alta Familiar'),

  // Otras
  {
    path: 'filiales',
    title: 'Filiales',
    loadComponent: () => import('./pages/filiales/filiales').then((m) => m.Filiales),
  },
  {
    path: 'contacto',
    title: 'Contacto',
    loadComponent: () => import('./pages/contact/contact').then((m) => m.Contact),
  },
  {
    path: 'recibos',
    title: 'Recibos',
    loadComponent: () => import('./pages/recibos/recibos').then((m) => m.Recibos),
  },
  infoRoute('alojamiento', 'alojamiento', 'Alojamiento'),
];
