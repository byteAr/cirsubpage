import { InjectionToken } from '@angular/core';

/**
 * El origen público del sitio, sin barra final.
 *
 * Hace falta para armar direcciones absolutas: la canónica y las de Open Graph
 * tienen que serlo, porque quien las lee —un buscador, el previsualizador de
 * WhatsApp— no tiene contra qué resolver una ruta relativa.
 *
 * En el navegador sale del documento; al renderizar en el servidor, del entorno.
 */
export const ORIGEN_SITIO = new InjectionToken<string>('origen-sitio');
