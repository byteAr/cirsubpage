import type { Request } from 'express';

/**
 * Guarda un rato el HTML que sale del renderizado.
 *
 * Hoy cada visita anónima hace que Node arme la portada de cero: pide las
 * novedades y las filiales a la API, corre la aplicación entera y serializa el
 * resultado. Medido en el sitio, eso son casi setecientos milisegundos antes de
 * que al navegador le llegue el primer byte, y ese retraso se paga completo dos
 * veces, en el primer pintado y en el elemento más grande.
 *
 * El contenido de un sitio institucional no cambia de un minuto al otro, así
 * que la misma respuesta sirve para todos los que entren en ese rato. Lo que se
 * guarda es lo ya armado, incluido el estado que el navegador usa para hidratar
 * sin repetir las llamadas.
 *
 * Qué NO se guarda, y por qué importa:
 *
 *   - Cualquier cosa que no sea un GET que devolvió 200.
 *   - El panel, que es de cada persona.
 *   - Los pedidos que traen cookie de sesión. Hoy el sitio público no cambia
 *     según quién mire —ningún componente público consulta la sesión— pero si
 *     algún día cambiara, servirle a una persona la página armada para otra
 *     sería una fuga de datos, no un bug de rendimiento. Es más barato
 *     descartarlos ahora que acordarse después.
 */

interface Guardado {
  readonly vence: number;
  readonly estado: number;
  readonly cabeceras: [string, string][];
  readonly cuerpo: string;
}

/** Diez minutos dejaría novedades viejas a la vista demasiado tiempo. */
const VIGENCIA_MS = 60_000;

/**
 * Tope de páginas guardadas. Un robot que recorra todas las novedades no puede
 * hacer crecer esto sin límite; al llegar al tope se tira la más vieja.
 */
const TOPE = 200;

const guardadas = new Map<string, Guardado>();

function clave(pedido: Request): string {
  return pedido.originalUrl || pedido.url;
}

export function sirveParaCache(pedido: Request): boolean {
  if (pedido.method !== 'GET') return false;

  const ruta = pedido.path;
  if (ruta.startsWith('/admin') || ruta.startsWith('/api')) return false;

  // Con sesión encima, se renderiza siempre de nuevo.
  if (pedido.headers.cookie) return false;

  return true;
}

export function buscar(pedido: Request): Guardado | null {
  const encontrada = guardadas.get(clave(pedido));
  if (!encontrada) return null;

  if (Date.now() > encontrada.vence) {
    guardadas.delete(clave(pedido));
    return null;
  }

  /*
    Al volver a encontrarla se la reinserta, así queda como la más reciente y el
    tope termina descartando las que nadie pide.
  */
  guardadas.delete(clave(pedido));
  guardadas.set(clave(pedido), encontrada);
  return encontrada;
}

export function guardar(pedido: Request, respuesta: Response): void {
  if (respuesta.status !== 200) return;

  const tipo = respuesta.headers.get('content-type') ?? '';
  if (!tipo.includes('text/html')) return;

  void respuesta
    .clone()
    .text()
    .then((cuerpo) => {
      if (guardadas.size >= TOPE) {
        const masVieja = guardadas.keys().next().value;
        if (masVieja !== undefined) guardadas.delete(masVieja);
      }

      guardadas.set(clave(pedido), {
        vence: Date.now() + VIGENCIA_MS,
        estado: respuesta.status,
        cabeceras: [...respuesta.headers.entries()],
        cuerpo,
      });
    })
    .catch(() => {
      // Si no se pudo leer, simplemente no se guarda.
    });
}

/** Rearma una respuesta a partir de lo guardado. */
export function aRespuesta(guardada: Guardado): Response {
  const cabeceras = new Headers(guardada.cabeceras);
  // Para poder ver desde afuera si la respuesta salió de acá.
  cabeceras.set('X-Cache-Sitio', 'HIT');

  return new Response(guardada.cuerpo, {
    status: guardada.estado,
    headers: cabeceras,
  });
}
