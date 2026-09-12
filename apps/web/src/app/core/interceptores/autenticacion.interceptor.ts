import { HttpErrorResponse, type HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { from, switchMap, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { SesionService } from '../servicios/sesion.service';

/** Rutas que nunca llevan token ni deben disparar una renovación. */
const ABIERTAS = ['/auth/ingresar', '/auth/refrescar', '/auth/salir', '/auth/activar', '/auth/recuperar', '/auth/restablecer', '/auth/invitacion', '/publico/'];

/**
 * Agrega el token de acceso a las llamadas del panel y lo renueva cuando vence.
 * Las rutas públicas pasan sin tocar, así el sitio renderiza en el servidor sin
 * depender de que haya sesión.
 */
export const autenticacionInterceptor: HttpInterceptorFn = (peticion, siguiente) => {
  const esAbierta = ABIERTAS.some((r) => peticion.url.includes(r));
  if (esAbierta) return siguiente(peticion);

  const sesion = inject(SesionService);

  return from(sesion.tokenValido()).pipe(
    switchMap((token) => {
      const conToken = token
        ? peticion.clone({ setHeaders: { Authorization: `Bearer ${token}` } })
        : peticion;

      return siguiente(conToken).pipe(
        catchError((error: unknown) => {
          // Un 401 acá significa que la cookie de refresco tampoco sirve.
          if (error instanceof HttpErrorResponse && error.status === 401) {
            void sesion.salir();
          }
          return throwError(() => error);
        }),
      );
    }),
  );
};
