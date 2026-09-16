import { DOCUMENT } from '@angular/common';
import { Injectable, inject } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';
import { ORIGEN_SITIO } from '../origen-sitio';

export interface Metadatos {
  /** Sin el sufijo del sitio: lo agrega el servicio. */
  readonly titulo: string;
  readonly descripcion: string;
  /** Ruta o dirección completa. Se vuelve absoluta sola. */
  readonly imagen?: string | null;
  readonly tipo?: 'website' | 'article';
  /** Ruta canónica. Por defecto, la que se está mostrando. */
  readonly canonica?: string;
  readonly publicadaEn?: string | null;
  readonly seccion?: string | null;
}

const NOMBRE_SITIO = 'CIRSUB';
const IMAGEN_POR_DEFECTO = '/cirsublogo-nuevo.webp';

/**
 * Los metadatos de cada vista: lo que ve un buscador en su listado y lo que
 * arma la tarjeta cuando alguien comparte un enlace.
 *
 * Se escriben todos en cada navegación, siempre, incluso los que no cambian.
 * En una aplicación de una sola página las etiquetas viven en el mismo
 * documento de principio a fin: si una vista pone `og:image` y la siguiente no
 * la pisa, esa imagen queda puesta y se comparte la nota equivocada. Escribir
 * todo cada vez cuesta nada y saca de raíz esa clase de error.
 *
 * La canónica se maneja aparte porque no es una etiqueta `meta` sino un `link`,
 * y Angular no trae nada para eso.
 */
@Injectable({ providedIn: 'root' })
export class Seo {
  private readonly meta = inject(Meta);
  private readonly titulo = inject(Title);
  private readonly documento = inject(DOCUMENT);
  private readonly origen = inject(ORIGEN_SITIO).replace(/\/$/, '');

  aplicar(datos: Metadatos): void {
    const tipo = datos.tipo ?? 'website';
    const titulo = `${datos.titulo} · ${NOMBRE_SITIO}`;
    const ruta = datos.canonica ?? this.documento.location.pathname;
    const url = this.absoluta(ruta);
    const imagen = this.absoluta(datos.imagen || IMAGEN_POR_DEFECTO);

    this.titulo.setTitle(titulo);

    this.etiqueta('name', 'description', datos.descripcion);

    this.etiqueta('property', 'og:site_name', NOMBRE_SITIO);
    this.etiqueta('property', 'og:locale', 'es_AR');
    this.etiqueta('property', 'og:type', tipo);
    this.etiqueta('property', 'og:title', titulo);
    this.etiqueta('property', 'og:description', datos.descripcion);
    this.etiqueta('property', 'og:url', url);
    this.etiqueta('property', 'og:image', imagen);

    /*
      La tarjeta grande es la que muestra la imagen arriba del texto. Con la
      chica, una portada de novedad queda en una miniatura al costado.
    */
    this.etiqueta('name', 'twitter:card', 'summary_large_image');
    this.etiqueta('name', 'twitter:title', titulo);
    this.etiqueta('name', 'twitter:description', datos.descripcion);
    this.etiqueta('name', 'twitter:image', imagen);

    // Propias de un artículo: se ponen o se sacan según corresponda.
    this.opcional('property', 'article:published_time', tipo === 'article' ? datos.publicadaEn : null);
    this.opcional('property', 'article:section', tipo === 'article' ? datos.seccion : null);

    this.canonica(url);
  }

  /** Vuelve absoluta una ruta, y deja como está lo que ya lo es. */
  private absoluta(valor: string): string {
    if (/^https?:\/\//i.test(valor)) return valor;
    return `${this.origen}${valor.startsWith('/') ? '' : '/'}${valor}`;
  }

  private etiqueta(clave: 'name' | 'property', nombre: string, contenido: string): void {
    this.meta.updateTag({ [clave]: nombre, content: contenido }, `${clave}='${nombre}'`);
  }

  private opcional(clave: 'name' | 'property', nombre: string, contenido?: string | null): void {
    const selector = `${clave}='${nombre}'`;
    if (contenido) this.meta.updateTag({ [clave]: nombre, content: contenido }, selector);
    else this.meta.removeTag(selector);
  }

  /**
   * La dirección que el buscador debe considerar la buena.
   *
   * Sin esto, la misma página alcanzable con parámetros distintos —una campaña,
   * un filtro, lo que pegue alguien en un mensaje— se cuenta como varias
   * páginas repetidas, y la relevancia se reparte entre todas en vez de sumarse
   * en una.
   */
  private canonica(url: string): void {
    let enlace = this.documento.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    if (!enlace) {
      enlace = this.documento.createElement('link');
      enlace.setAttribute('rel', 'canonical');
      this.documento.head.appendChild(enlace);
    }
    enlace.setAttribute('href', url);
  }
}
