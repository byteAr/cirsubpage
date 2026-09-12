/**
 * Contenido declarativo para una página informativa.
 * Permite renderizar páginas estáticas (servicios, trámites, etc.) desde un único componente.
 */
import { IconoServicio } from './servicio.model';

export interface InfoPageContent {
  readonly titulo: string;
  readonly subtitulo?: string;
  readonly icono?: IconoServicio;
  readonly imagen?: string;
  readonly bloques: readonly InfoPageBloque[];
  readonly cta?: {
    readonly texto: string;
    readonly enlace: string;
    readonly externo?: boolean;
  };
}

export type InfoPageBloque =
  | { readonly tipo: 'parrafo'; readonly contenido: string }
  | { readonly tipo: 'titulo'; readonly contenido: string }
  | { readonly tipo: 'lista'; readonly items: readonly string[] }
  | { readonly tipo: 'destacado'; readonly contenido: string };
