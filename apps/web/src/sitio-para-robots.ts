import type { Request, Response } from 'express';

/**
 * Los dos archivos que leen los buscadores antes que nada: `robots.txt`, que
 * dice por dónde pueden pasar, y `sitemap.xml`, que les ahorra descubrir el
 * sitio a fuerza de seguir enlaces.
 *
 * Van servidos desde acá y no como archivos sueltos en `public` porque los dos
 * necesitan el dominio, que cambia entre el entorno de prueba y el definitivo,
 * y el mapa además necesita la lista de novedades, páginas y filiales, que vive
 * en la base.
 *
 * Sin esto la ruta comodín del renderizado devolvía la página de «no
 * encontrado» para `/robots.txt`: los buscadores recibían HTML donde esperaban
 * un archivo de texto.
 */

/** Rutas que existen siempre, con su prioridad relativa. */
const RUTAS_FIJAS: readonly (readonly [string, string])[] = [
  ['/', '1.0'],
  ['/novedades', '0.9'],
  ['/beneficios', '0.9'],
  ['/tramites', '0.8'],
  ['/filiales', '0.8'],
  ['/nosotros', '0.7'],
  ['/nosotros/institucional', '0.6'],
  ['/nosotros/autoridades', '0.6'],
  ['/contacto', '0.7'],
  ['/recibos', '0.7'],
  ['/alojamiento', '0.6'],
];

interface NovedadDelMapa {
  readonly slug: string;
  readonly publicadaEn: string | null;
}

interface PaginaDelMapa {
  readonly slug: string;
  readonly tipo: string;
}

/** Lo que se le pide a la API para armar el mapa. */
async function traer<T>(base: string, ruta: string): Promise<T | null> {
  try {
    const respuesta = await fetch(`${base}${ruta}`, {
      headers: { accept: 'application/json' },
      signal: AbortSignal.timeout(5000),
    });
    if (!respuesta.ok) return null;
    return (await respuesta.json()) as T;
  } catch {
    // Un mapa incompleto es mejor que un 500: se devuelven las rutas fijas.
    return null;
  }
}

function escapar(texto: string): string {
  return texto
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function entrada(base: string, ruta: string, prioridad: string, fecha?: string | null): string {
  const cuando = fecha ? `\n    <lastmod>${escapar(fecha.slice(0, 10))}</lastmod>` : '';
  return (
    `  <url>\n` +
    `    <loc>${escapar(base + ruta)}</loc>${cuando}\n` +
    `    <priority>${prioridad}</priority>\n` +
    `  </url>`
  );
}

/**
 * El mapa se rearma cada tanto, no en cada visita. Los robots lo piden seguido y
 * cada armado son tres llamadas a la base; el contenido de un sitio
 * institucional no cambia de un minuto al otro.
 */
const VIGENCIA_MS = 10 * 60 * 1000;
let cache: { cuando: number; xml: string } | null = null;

async function armarMapa(origen: string, baseApi: string): Promise<string> {
  const [novedades, paginas] = await Promise.all([
    traer<{ items: NovedadDelMapa[] }>(baseApi, '/publico/novedades?pagina=1&porPagina=500'),
    traer<PaginaDelMapa[]>(baseApi, '/publico/paginas'),
  ]);

  const urls = [
    ...RUTAS_FIJAS.map(([ruta, prioridad]) => entrada(origen, ruta, prioridad)),

    ...(novedades?.items ?? []).map((n) =>
      entrada(origen, `/novedades/${n.slug}`, '0.8', n.publicadaEn),
    ),

    /*
      Las páginas informativas cuelgan de dos prefijos distintos según su tipo,
      tal como las publica el enrutador. Las institucionales quedan afuera: no
      tienen ruta propia, se muestran dentro de /nosotros.
    */
    ...(paginas ?? [])
      .filter((p) => p.tipo === 'SERVICIO' || p.tipo === 'TRAMITE')
      .map((p) =>
        entrada(origen, `${p.tipo === 'SERVICIO' ? '/servicios' : '/tramites'}/${p.slug}`, '0.7'),
      ),
  ];

  return (
    `<?xml version="1.0" encoding="UTF-8"?>\n` +
    `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
    urls.join('\n') +
    `\n</urlset>\n`
  );
}

export interface OpcionesRobots {
  /** Origen público del sitio, sin barra final. */
  readonly origen: string;
  /** Base de la API por la red interna. */
  readonly baseApi: string;
  /**
   * Si los buscadores pueden indexar. En el entorno de prueba conviene que no:
   * un duplicado del sitio en otro subdominio compite contra el definitivo.
   */
  readonly indexable: boolean;
}

export function robotsTxt(opciones: OpcionesRobots) {
  return (_pedido: Request, respuesta: Response): void => {
    const cuerpo = opciones.indexable
      ? `User-agent: *\n` +
        `Allow: /\n` +
        `Disallow: /admin\n` +
        `Disallow: /api/\n` +
        `\n` +
        `Sitemap: ${opciones.origen}/sitemap.xml\n`
      : // Entorno de prueba: que no quede indexado nada.
        `User-agent: *\nDisallow: /\n`;

    respuesta.type('text/plain; charset=utf-8');
    respuesta.setHeader('Cache-Control', 'public, max-age=3600');
    respuesta.send(cuerpo);
  };
}

export function sitemapXml(opciones: OpcionesRobots) {
  return async (_pedido: Request, respuesta: Response): Promise<void> => {
    const ahora = Date.now();
    if (!cache || ahora - cache.cuando > VIGENCIA_MS) {
      cache = { cuando: ahora, xml: await armarMapa(opciones.origen, opciones.baseApi) };
    }

    respuesta.type('application/xml; charset=utf-8');
    respuesta.setHeader('Cache-Control', 'public, max-age=3600');
    respuesta.send(cache.xml);
  };
}
