import { Routes } from '@angular/router';

export const routes: Routes = [

  // Rutas públicas (Lazy Loading)
  {
    path: '',
    loadChildren: () => import('./features/public/public.routes').then(m => m.PUBLIC_ROUTES),
  },

  // Rutas de usuario (Lazy Loading)
  {
    path: 'user',
    loadChildren: () => import('./features/user/user.routes').then(m => m.USER_ROUTES),
    // Aquí puedes agregar un guardia de ruta (AuthGuard) para proteger estas rutas
  },

  // Rutas de administrador (Lazy Loading)
  {
    path: 'admin',
    loadChildren: () => import('./features/admin/admin.routes').then(m => m.ADMIN_ROUTES),
    // Es CRUCIAL agregar guardias de ruta para verificar roles de administrador
  },

  // Ruta de comodín para cualquier otra URL (Página 404)
  { path: '**', redirectTo: '' }
];

