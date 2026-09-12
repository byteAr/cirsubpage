/** Tipos del contenido institucional, compartidos por la API y el sitio. */

export type TipoPagina = 'SERVICIO' | 'TRAMITE' | 'INSTITUCIONAL';

export type TipoBloque = 'PARRAFO' | 'TITULO' | 'LISTA' | 'DESTACADO';

export interface BloqueInfo {
  readonly id?: string;
  readonly tipo: TipoBloque;
  readonly contenido: string | null;
  readonly items: readonly string[] | null;
  readonly orden: number;
}

export interface PaginaInfo {
  readonly id: string;
  readonly slug: string;
  readonly tipo: TipoPagina;
  readonly titulo: string;
  readonly subtitulo: string | null;
  readonly icono: string | null;
  readonly imagenUrl: string | null;
  readonly ctaTexto: string | null;
  readonly ctaEnlace: string | null;
  readonly ctaExterno: boolean;
  readonly orden: number;
  readonly bloques: readonly BloqueInfo[];
}

export interface Filial {
  readonly id: string;
  readonly nombre: string;
  readonly direccion: string | null;
  readonly telefono: string | null;
  readonly email: string | null;
  readonly lat: number;
  readonly lng: number;
  readonly svgX: number | null;
  readonly svgY: number | null;
  readonly fotoUrl: string | null;
  readonly orden: number;
}

export interface Autoridad {
  readonly id: string;
  readonly nombre: string;
  readonly rango: string;
  readonly cargo: string;
  readonly grupo: string;
  readonly orden: number;
  readonly fotoUrl: string | null;
  readonly reportaA: string | null;
}

export interface Contacto {
  readonly id: string;
  readonly nombre: string;
  readonly email: string;
  readonly telefono: string | null;
  readonly interno: string | null;
  readonly icono: string;
  readonly orden: number;
}

export interface ImagenVariantes {
  readonly original: string;
  readonly avif?: string;
  readonly webp?: string;
  readonly srcset?: string;
  readonly ancho?: number;
  readonly alto?: number;
  readonly alt?: string;
}

export interface SlideCarrusel {
  readonly id: string;
  readonly slug: string;
  readonly volanta: string;
  readonly titulo: string;
  readonly bajada: string;
  readonly imagen: ImagenVariantes | null;
}

export interface NovedadResumen {
  readonly id: string;
  readonly slug: string;
  readonly titulo: string;
  readonly bajada: string | null;
  readonly categoria: { readonly slug: string; readonly nombre: string } | null;
  readonly portada: ImagenVariantes | null;
  readonly publicadaEn: string | null;
  readonly filial: { readonly id: string; readonly nombre: string } | null;
  readonly minutosLectura: number;
}

export interface NovedadDetalle extends NovedadResumen {
  readonly cuerpoHtml: string;
  readonly autor: string | null;
  readonly relacionadas: readonly NovedadResumen[];
}

export interface Paginado<T> {
  readonly items: readonly T[];
  readonly total: number;
  readonly pagina: number;
  readonly porPagina: number;
  readonly totalPaginas: number;
}
