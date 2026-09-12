import { Routes } from '@angular/router';

export const routes: Routes = [
  // El panel va antes que las rutas públicas para que /admin no caiga en el comodín.
  {
    path: 'admin',
    loadChildren: () => import('./features/admin/admin.routes').then((m) => m.ADMIN_ROUTES),
  },
  {
    path: '',
    loadChildren: () => import('./features/public/public.routes').then((m) => m.PUBLIC_ROUTES),
  },
  {
    path: '**',
    title: 'Página no encontrada · CIRSUB',
    loadComponent: () => import('./features/public/pages/error404/error404').then((m) => m.Error404),
  },
];
