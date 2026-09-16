import {
  AngularNodeAppEngine,
  createNodeRequestHandler,
  isMainModule,
  writeResponseToNodeResponse,
} from '@angular/ssr/node';
import express from 'express';
import { join } from 'node:path';
import { robotsTxt, sitemapXml } from './sitio-para-robots';
import { aRespuesta, buscar, guardar, sirveParaCache } from './cache-html';

const browserDistFolder = join(import.meta.dirname, '../browser');

const app = express();

/*
  Los nombres de dominio con los que el sitio se deja renderizar en el servidor.

  Angular compara contra esta lista la cabecera `Host` de cada pedido, para que
  nadie pueda hacerle creer que vive en otro dominio y sacarle una respuesta
  armada con ese nombre. La lista vacía no significa «todos»: significa que
  ningún nombre pasa. Y ante un nombre que no pasa Angular no devuelve un error,
  devuelve la página vacía para que se arme en el navegador. Sin esta lista no
  hay renderizado en servidor: ni para el visitante ni para los buscadores.

  Se arma con el origen público, que ya viene por el entorno, más los nombres
  locales, que son los del desarrollo y los de cualquier chequeo de salud.
*/
const urlSitio = process.env['URL_SITIO'];
const hostsPermitidos = [
  ...(urlSitio ? [new URL(urlSitio).hostname] : []),
  'localhost',
  '127.0.0.1',
  '[::1]',
];

/*
  De las cabeceras `X-Forwarded-*` sólo se confía en el protocolo: es la única
  que hace falta, porque el nombre del sitio llega en `Host`. Con cualquier otra
  presente y no declarada acá Angular también renuncia a renderizar, así que
  nginx borra las demás antes de pasar el pedido.
*/
const angularApp = new AngularNodeAppEngine({
  allowedHosts: hostsPermitidos,
  trustProxyHeaders: ['x-forwarded-proto'],
});

/*
  Lo que leen los buscadores antes que nada. Van antes del renderizado: si no,
  la ruta comodín les contesta con la página de «no encontrado» y reciben HTML
  donde esperan texto.

  Fuera del dominio definitivo el sitio se declara no indexable. Un duplicado en
  otro subdominio compite en las búsquedas contra el que interesa posicionar,
  así que hay que pedirlo a propósito.
*/
const opcionesRobots = {
  origen: (urlSitio ?? 'http://localhost:4400').replace(/\/$/, ''),
  baseApi: (process.env['API_INTERNA'] ?? 'http://localhost:3400/api').replace(/\/$/, ''),
  indexable: process.env['SITIO_INDEXABLE'] === 'true',
};

app.get('/robots.txt', robotsTxt(opcionesRobots));
app.get('/sitemap.xml', sitemapXml(opcionesRobots));

/*
  Los archivos del navegador.

  Todo lo que el compilador emite lleva el hash del contenido en el nombre, así
  que puede quedar cacheado para siempre: si cambia, cambia el nombre. El resto
  de lo que hay en `public` —el ícono, los logos, las capturas— conserva su
  nombre entre versiones, así que se le da un día y se lo hace revalidar.
*/
app.use(
  express.static(browserDistFolder, {
    index: false,
    redirect: false,
    setHeaders: (respuesta, ruta) => {
      const conHuella = /-[A-Z0-9]{8}\.[^.]+$/.test(ruta);
      respuesta.setHeader(
        'Cache-Control',
        conHuella ? 'public, max-age=31536000, immutable' : 'public, max-age=86400, must-revalidate',
      );
    },
  }),
);

/**
 * Handle all other requests by rendering the Angular application.
 */
app.use((req, res, next) => {
  const cacheable = sirveParaCache(req);

  if (cacheable) {
    const guardada = buscar(req);
    if (guardada) {
      writeResponseToNodeResponse(aRespuesta(guardada), res);
      return;
    }
  }

  angularApp
    .handle(req)
    .then((response) => {
      if (!response) return next();
      if (cacheable) guardar(req, response);
      return writeResponseToNodeResponse(response, res);
    })
    .catch(next);
});

/**
 * Start the server if this module is the main entry point.
 * The server listens on the port defined by the `PORT` environment variable, or defaults to 4000.
 */
if (isMainModule(import.meta.url)) {
  const port = process.env['PORT'] || 4000;
  app.listen(port, (error) => {
    if (error) {
      throw error;
    }

    console.log(`Node Express server listening on http://localhost:${port}`);
  });
}

/**
 * Request handler used by the Angular CLI (for dev-server and during build) or Firebase Cloud Functions.
 */
export const reqHandler = createNodeRequestHandler(app);
