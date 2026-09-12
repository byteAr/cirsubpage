import { RenderMode, ServerRoute } from '@angular/ssr';

/**
 * Estrategia de renderizado.
 *
 * El sitio público se arma en el servidor en cada pedido, porque el contenido
 * viene de la base y cambia cuando el panel publica algo. Prerenderizar dejaría
 * novedades viejas congeladas en el paquete.
 *
 * El panel se renderiza solo en el navegador: necesita sesión, y no tiene
 * sentido que un robot de búsqueda lo indexe.
 */
export const serverRoutes: ServerRoute[] = [
  {
    path: 'admin/**',
    renderMode: RenderMode.Client,
  },
  {
    path: '**',
    renderMode: RenderMode.Server,
  },
];
