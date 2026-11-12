import { Routes } from '@angular/router';
import { PERMISOS } from '@cirsub/shared';
import { inicioGuard, permisoGuard, sesionGuard } from '../../core/guardias/sesion.guard';

export const ADMIN_ROUTES: Routes = [
  // Acceso: sin sesión y sin la estructura del panel
  {
    path: 'ingresar',
    title: 'Ingresar · Panel CIRSUB',
    loadComponent: () => import('./paginas/ingreso/ingreso').then((m) => m.Ingreso),
  },
  {
    path: 'activar',
    title: 'Activar la cuenta · Panel CIRSUB',
    loadComponent: () => import('./paginas/activar/activar').then((m) => m.Activar),
  },
  {
    path: 'recuperar',
    title: 'Recuperar la contraseña · Panel CIRSUB',
    loadComponent: () => import('./paginas/recuperar/recuperar').then((m) => m.Recuperar),
  },
  {
    path: 'restablecer',
    title: 'Nueva contraseña · Panel CIRSUB',
    loadComponent: () => import('./paginas/recuperar/restablecer').then((m) => m.Restablecer),
  },

  // Panel
  {
    path: '',
    canActivate: [sesionGuard],
    loadComponent: () => import('./componentes/estructura').then((m) => m.Estructura),
    children: [
      {
        path: '',
        title: 'Tablero · Panel CIRSUB',
        canActivate: [inicioGuard],
        loadComponent: () => import('./paginas/tablero/tablero').then((m) => m.Tablero),
      },
      {
        path: 'novedades',
        title: 'Novedades · Panel CIRSUB',
        canActivate: [permisoGuard(PERMISOS.NOVEDADES_CREAR, PERMISOS.NOVEDADES_REVISAR)],
        loadComponent: () =>
          import('./paginas/novedades/lista-novedades').then((m) => m.ListaNovedades),
      },
      {
        path: 'novedades/nueva',
        title: 'Nueva novedad · Panel CIRSUB',
        canActivate: [permisoGuard(PERMISOS.NOVEDADES_CREAR)],
        loadComponent: () =>
          import('./paginas/novedades/editor-novedad').then((m) => m.EditorNovedad),
      },
      {
        path: 'novedades/:id',
        title: 'Editar novedad · Panel CIRSUB',
        canActivate: [permisoGuard(PERMISOS.NOVEDADES_CREAR, PERMISOS.NOVEDADES_REVISAR)],
        loadComponent: () =>
          import('./paginas/novedades/editor-novedad').then((m) => m.EditorNovedad),
      },
      {
        path: 'carrusel',
        title: 'Carrusel de portada · Panel CIRSUB',
        canActivate: [permisoGuard(PERMISOS.CARRUSEL_EDITAR)],
        loadComponent: () => import('./paginas/novedades/carrusel').then((m) => m.Carrusel),
      },
      {
        path: 'aprobaciones',
        title: 'Aprobaciones · Panel CIRSUB',
        canActivate: [permisoGuard(PERMISOS.CAMBIOS_APROBAR)],
        loadComponent: () =>
          import('./paginas/aprobaciones/aprobaciones').then((m) => m.Aprobaciones),
      },
      {
        path: 'bajas',
        title: 'Pedidos de baja · Panel CIRSUB',
        canActivate: [permisoGuard(PERMISOS.BAJAS_GESTIONAR)],
        loadComponent: () => import('./paginas/bajas/bajas').then((m) => m.Bajas),
      },
      {
        path: 'simulador',
        title: 'Simulador de préstamos · Panel CIRSUB',
        canActivate: [permisoGuard(PERMISOS.SIMULADOR_EDITAR)],
        loadComponent: () => import('./paginas/simulador/simulador').then((m) => m.Simulador),
      },
      {
        path: 'filiales',
        title: 'Filiales · Panel CIRSUB',
        canActivate: [permisoGuard(PERMISOS.FILIALES_EDITAR)],
        loadComponent: () =>
          import('./paginas/filiales/lista-filiales').then((m) => m.ListaFiliales),
      },
      {
        path: 'filiales/:id',
        title: 'Datos de la filial · Panel CIRSUB',
        canActivate: [permisoGuard(PERMISOS.FILIALES_EDITAR)],
        loadComponent: () =>
          import('./paginas/filiales/editor-filial').then((m) => m.EditorFilial),
      },
      {
        path: 'medios',
        title: 'Medios · Panel CIRSUB',
        canActivate: [permisoGuard(PERMISOS.MEDIOS_SUBIR)],
        loadComponent: () => import('./paginas/medios/medios').then((m) => m.Medios),
      },
      {
        path: 'usuarios',
        title: 'Usuarios · Panel CIRSUB',
        canActivate: [permisoGuard(PERMISOS.USUARIOS_INVITAR, PERMISOS.USUARIOS_ADMINISTRAR)],
        loadComponent: () => import('./paginas/usuarios/usuarios').then((m) => m.Usuarios),
      },
      {
        path: 'auditoria',
        title: 'Auditoría · Panel CIRSUB',
        canActivate: [permisoGuard(PERMISOS.AUDITORIA_VER)],
        loadComponent: () => import('./paginas/usuarios/auditoria').then((m) => m.Auditoria),
      },
      {
        path: 'perfil',
        title: 'Mi perfil · Panel CIRSUB',
        loadComponent: () => import('./paginas/perfil/perfil').then((m) => m.Perfil),
      },
      { path: '**', redirectTo: '' },
    ],
  },
];
