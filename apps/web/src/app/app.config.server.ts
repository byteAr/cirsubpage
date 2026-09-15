import {
  mergeApplicationConfig,
  ApplicationConfig,
  EnvironmentProviders,
  Provider,
} from '@angular/core';
import { HTTP_TRANSFER_CACHE_ORIGIN_MAP } from '@angular/common/http';
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

/** Origen público del sitio. Sin él no se traduce nada y las URLs ya coinciden. */
const urlSitio = process.env['URL_SITIO'];

const providers: (Provider | EnvironmentProviders)[] = [
  provideServerRendering(withRoutes(serverRoutes)),
  { provide: BASE_API, useValue: baseApiServidor },
];

/*
  Lo que el servidor deja guardado para el navegador va indexado por la URL de
  cada pedido, y acá esa URL es la interna de Docker, que en el navegador no
  existe. Sin esta traducción ninguna clave coincide, el navegador vuelve a pedir
  todo lo que el servidor ya había traído y el contenido parpadea al hidratar.
*/
if (urlSitio) {
  providers.push({
    provide: HTTP_TRANSFER_CACHE_ORIGIN_MAP,
    useValue: { [new URL(baseApiServidor).origin]: new URL(urlSitio).origin },
  });
}

const serverConfig: ApplicationConfig = { providers };

export const config = mergeApplicationConfig(appConfig, serverConfig);
