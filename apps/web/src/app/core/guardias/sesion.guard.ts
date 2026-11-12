import { PLATFORM_ID, inject } from '@angular/core';
import { isPlatformServer } from '@angular/common';
import { Router, type CanActivateFn } from '@angular/router';
import { PERMISOS, type Permiso } from '@cirsub/shared';
import { SesionService } from '../servicios/sesion.service';

/**
 * Exige sesión iniciada para entrar al panel.
 *
 * En el servidor deja pasar sin más: el panel se renderiza solo en el navegador
 * y la sesión vive en una cookie que el proceso de renderizado no debe usar.
 */
export const sesionGuard: CanActivateFn = async (_ruta, estado) => {
  if (isPlatformServer(inject(PLATFORM_ID))) return true;

  const sesion = inject(SesionService);
  const router = inject(Router);

  if (!sesion.autenticado()) {
    await sesion.restaurar();
  }

  if (sesion.autenticado()) return true;

  return router.createUrlTree(['/admin/ingresar'], { queryParams: { volver: estado.url } });
};

/**
 * La portada del panel es el tablero, pero no todos lo tienen: quien mantiene
 * una filial o el simulador entra directo a su sección.
 */
export const inicioGuard: CanActivateFn = () => {
  if (isPlatformServer(inject(PLATFORM_ID))) return true;

  const sesion = inject(SesionService);
  const router = inject(Router);
  if (sesion.puede(PERMISOS.TABLERO_VER)) return true;

  const destino =
    ([
      [PERMISOS.FILIALES_EDITAR, '/admin/filiales'],
      [PERMISOS.SIMULADOR_EDITAR, '/admin/simulador'],
      [PERMISOS.NOVEDADES_CREAR, '/admin/novedades'],
    ] as const).find(([permiso]) => sesion.puede(permiso))?.[1] ?? '/admin/perfil';
  return router.createUrlTree([destino]);
};

/**
 * Exige uno de los permisos indicados.
 * Ocultar en el frontend es comodidad; quien decide de verdad es la API.
 */
export const permisoGuard = (...permisos: Permiso[]): CanActivateFn => {
  return () => {
    if (isPlatformServer(inject(PLATFORM_ID))) return true;

    const sesion = inject(SesionService);
    const router = inject(Router);

    if (sesion.puedeAlguno(...permisos)) return true;
    return router.createUrlTree(['/admin']);
  };
};
