import { Routes } from '@angular/router';

export const PUBLIC_ROUTES: Routes = [
  {
    path: '',
    title: 'CIRSUB',
    loadComponent: () => import('./pages/home/home').then((m) => m.Home),
  },

  // Novedades
  {
    path: 'novedades',
    title: 'Novedades · CIRSUB',
    loadComponent: () => import('./pages/novedades/novedades').then((m) => m.Novedades),
  },
  {
    path: 'novedades/:slug',
    loadComponent: () => import('./pages/novedades/novedad-detalle').then((m) => m.NovedadDetalle),
  },

  // Nosotros
  {
    path: 'nosotros',
    title: 'Nosotros · CIRSUB',
    loadComponent: () => import('./pages/nosotros/nosotros').then((m) => m.Nosotros),
  },
  {
    path: 'nosotros/institucional',
    title: 'Institucional · CIRSUB',
    loadComponent: () =>
      import('./pages/nosotros/institucional/institucional').then((m) => m.Institucional),
  },
  {
    path: 'nosotros/autoridades',
    title: 'Autoridades · CIRSUB',
    loadComponent: () =>
      import('./pages/nosotros/autoridades/autoridades').then((m) => m.Autoridades),
  },

  // Servicios y trámites: el índice y la plantilla única de página informativa
  {
    path: 'beneficios',
    title: 'Servicios · CIRSUB',
    loadComponent: () => import('./pages/beneficios/beneficios').then((m) => m.Beneficios),
  },
  {
    path: 'servicios/:slug',
    loadComponent: () =>
      import('../../shared/components/info-page/info-page').then((m) => m.InfoPage),
  },
  {
    path: 'tramites',
    title: 'Trámites · CIRSUB',
    loadComponent: () => import('./pages/tramites/tramites').then((m) => m.Tramites),
  },
  {
    path: 'tramites/:slug',
    loadComponent: () =>
      import('../../shared/components/info-page/info-page').then((m) => m.InfoPage),
  },

  {
    path: 'filiales',
    title: 'Filiales · CIRSUB',
    loadComponent: () => import('./pages/filiales/filiales').then((m) => m.Filiales),
  },
  {
    path: 'contacto',
    title: 'Contacto · CIRSUB',
    loadComponent: () => import('./pages/contact/contact').then((m) => m.Contact),
  },
  {
    path: 'recibos',
    title: 'Recibos de haberes · CIRSUB',
    loadComponent: () => import('./pages/recibos/recibos').then((m) => m.Recibos),
  },
  {
    path: 'alojamiento',
    title: 'Alojamiento · CIRSUB',
    loadComponent: () =>
      import('../../shared/components/info-page/info-page').then((m) => m.InfoPage),
    data: { slug: 'alojamiento' },
  },
];
