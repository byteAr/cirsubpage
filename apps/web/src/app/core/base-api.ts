import { InjectionToken } from '@angular/core';

/**
 * Dirección base de la API.
 *
 * En el navegador es una ruta relativa —`/api`— porque el sitio y la API viven
 * en el mismo dominio: nginx manda ese prefijo al contenedor. Mismo origen
 * significa que no hay CORS y que la cookie de sesión queda atada al sitio en
 * vez de repartirse por todos los subdominios.
 *
 * Al renderizar en el servidor no hay un origen contra el cual resolver una
 * ruta relativa, así que ahí el valor tiene que ser absoluto. Se resuelve por
 * separado en `app.config.server.ts`, apuntando al contenedor de la API por la
 * red interna: el renderizado no sale a internet ni pasa por el proxy.
 */
export const BASE_API = new InjectionToken<string>('base-api');
