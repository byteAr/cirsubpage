import {
  ApplicationConfig,
  inject,
  provideBrowserGlobalErrorListeners,
  provideZonelessChangeDetection,
} from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { provideRouter, withInMemoryScrolling, withViewTransitions } from '@angular/router';
import { provideHttpClient, withFetch, withInterceptors } from '@angular/common/http';
import {
  provideClientHydration,
  withEventReplay,
  withIncrementalHydration,
} from '@angular/platform-browser';

import { routes } from './app.routes';
import { BASE_API } from './core/base-api';
import { ORIGEN_SITIO } from './core/origen-sitio';
import { autenticacionInterceptor } from './core/interceptores/autenticacion.interceptor';
import { environment } from '../environments/environment';

export const appConfig: ApplicationConfig = {
  providers: [
    provideHttpClient(withFetch(), withInterceptors([autenticacionInterceptor])),
    provideBrowserGlobalErrorListeners(),
    provideZonelessChangeDetection(),
    /*
      La transición entre rutas la hace el navegador con la API de vistas, no
      `@angular/animations`. La versión anterior posicionaba en absoluto la vista
      que salía y la que entraba, así que durante 300 ms la página medía distinto
      y el contenido se corría; encima, sin zonas los nodos que salían quedaban
      colgados en el documento. Donde el navegador no la soporta la navegación es
      instantánea, sin transición, que es el comportamiento deseable.
    */
    provideRouter(
      routes,
      withInMemoryScrolling({ scrollPositionRestoration: 'top' }),
      withViewTransitions({ skipInitialTransition: true }),
    ),
    /*
      Hidratación incremental: el servidor manda la página entera y el navegador
      pone en marcha cada bloque `@defer (hydrate ...)` recién cuando hace falta.
      Es lo que permite diferir el mapa y la presentación de la app sin sacarlos
      del HTML, así que los buscadores los siguen viendo completos.
    */
    provideClientHydration(withEventReplay(), withIncrementalHydration()),
    {
      provide: BASE_API,
      /*
        En producción el sitio y la API comparten dominio, así que alcanzaría con
        la ruta relativa. Se la vuelve absoluta porque la clave del caché de
        transferencia es la URL completa: el servidor pidió los datos a
        `http://api:3400/api/...` y si acá la clave fuera `/api/...` no
        coincidirían y el navegador repetiría todas las llamadas. El servidor
        traduce su origen interno al del sitio (ver `app.config.server.ts`) y de
        este lado se arma el mismo origen desde el documento.
      */
      useFactory: (): string => {
        const base = environment.urlApi;
        if (!base.startsWith('/')) return base;
        return `${inject(DOCUMENT).location.origin}${base}`;
      },
    },
    {
      // En el navegador el origen lo dice el propio documento.
      provide: ORIGEN_SITIO,
      useFactory: (): string => inject(DOCUMENT).location.origin,
    },
  ],
};
