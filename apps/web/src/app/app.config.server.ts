import { mergeApplicationConfig, ApplicationConfig } from '@angular/core';
import { provideServerRendering, withRoutes } from '@angular/ssr';
import { appConfig } from './app.config';
import { serverRoutes } from './app.routes.server';
import { BASE_API } from './core/base-api';

/**
 * Al renderizar en el servidor la ruta relativa del navegador no sirve: no hay
 * origen contra el cual resolverla. Se apunta directo al contenedor de la API
 * por la red interna de Docker, así el renderizado no sale a internet ni pasa
 * por el proxy para pedirse datos a sí mismo.
 *
 * El valor por defecto es el del entorno de desarrollo, donde la API corre en
 * la misma máquina.
 */
const baseApiServidor = process.env['API_INTERNA'] ?? 'http://localhost:3400/api';

const serverConfig: ApplicationConfig = {
  providers: [
    provideServerRendering(withRoutes(serverRoutes)),
    { provide: BASE_API, useValue: baseApiServidor },
  ],
};

export const config = mergeApplicationConfig(appConfig, serverConfig);
