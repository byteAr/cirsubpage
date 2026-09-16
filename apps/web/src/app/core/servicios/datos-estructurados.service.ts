import { DOCUMENT } from '@angular/common';
import { Injectable, inject } from '@angular/core';
import type { Filial, NovedadDetalle } from '@cirsub/shared';
import { ORIGEN_SITIO } from '../origen-sitio';

/**
 * Los datos estructurados: lo mismo que ya dice la página, pero escrito de forma
 * que un buscador no tenga que adivinarlo.
 *
 * Google lee el texto y entiende bastante, pero no sabe con certeza que «Tacuarí
 * 566» es el domicilio de una entidad ni que las veinte filiales son sedes
 * físicas con teléfono propio. Dicho en este formato lo sabe, y es lo que habilita
 * que una filial aparezca en las búsquedas locales de su provincia: alguien en
 * Posadas que busca «mutual gendarmería» tiene que encontrar la filial de
 * Posadas, no la sede de Buenos Aires.
 *
 * Todo va en un único `<script>` que se reemplaza en cada navegación, por el
 * mismo motivo que los metadatos: en una aplicación de una sola página, lo que no
 * se pisa queda puesto, y dejar el bloque de una nota mientras se mira otra
 * página es peor que no tener ninguno.
 */

const ID_BLOQUE = 'datos-estructurados';

const NOMBRE = 'Mutual del Círculo de Suboficiales de Gendarmería Nacional Argentina';
const NOMBRE_CORTO = 'CIRSUB';

@Injectable({ providedIn: 'root' })
export class DatosEstructurados {
  private readonly documento = inject(DOCUMENT);
  private readonly origen = inject(ORIGEN_SITIO).replace(/\/$/, '');

  /** La entidad y el sitio. Va en todas las vistas públicas. */
  organizacion(): Record<string, unknown> {
    return {
      '@type': 'Organization',
      '@id': `${this.origen}/#organizacion`,
      name: NOMBRE,
      alternateName: NOMBRE_CORTO,
      url: `${this.origen}/`,
      logo: `${this.origen}/cirsublogo-nuevo.webp`,
      description:
        'Mutual que agrupa a suboficiales y gendarmes en actividad y retiro, pensionados, personal civil y sus familias. Subsidios, reintegros, turismo y asesoramiento.',
      address: {
        '@type': 'PostalAddress',
        streetAddress: 'Tacuarí 566',
        postalCode: '1071',
        addressLocality: 'Ciudad Autónoma de Buenos Aires',
        addressCountry: 'AR',
      },
      contactPoint: [
        {
          '@type': 'ContactPoint',
          contactType: 'Afiliaciones',
          telephone: '+54-11-4342-3068',
          email: 'afiliaciones@cirsubgn.org',
          areaServed: 'AR',
          availableLanguage: 'Spanish',
        },
      ],
    };
  }

  /** Para que el buscador sepa que esto es un sitio y no una página suelta. */
  sitio(): Record<string, unknown> {
    return {
      '@type': 'WebSite',
      '@id': `${this.origen}/#sitio`,
      url: `${this.origen}/`,
      name: NOMBRE_CORTO,
      inLanguage: 'es-AR',
      publisher: { '@id': `${this.origen}/#organizacion` },
    };
  }

  /**
   * Una filial como sede física.
   *
   * Lleva coordenadas cuando las tiene: es lo que permite que aparezca en una
   * búsqueda hecha desde esa zona.
   */
  filial(f: Filial): Record<string, unknown> {
    const datos: Record<string, unknown> = {
      '@type': 'LocalBusiness',
      '@id': `${this.origen}/filiales#${f.id}`,
      name: `${NOMBRE_CORTO} · Filial ${f.nombre}`,
      parentOrganization: { '@id': `${this.origen}/#organizacion` },
      url: `${this.origen}/filiales`,
      image: f.fotoUrl ? this.absoluta(f.fotoUrl) : `${this.origen}/cirsublogo-nuevo.webp`,
    };

    if (f.direccion) {
      datos['address'] = {
        '@type': 'PostalAddress',
        streetAddress: f.direccion,
        addressLocality: f.nombre,
        addressCountry: 'AR',
      };
    }
    if (f.telefono) datos['telephone'] = f.telefono;
    if (f.email) datos['email'] = f.email;
    if (f.lat && f.lng) {
      datos['geo'] = { '@type': 'GeoCoordinates', latitude: f.lat, longitude: f.lng };
    }

    return datos;
  }

  /** Una novedad como nota periodística. */
  novedad(n: NovedadDetalle): Record<string, unknown> {
    const datos: Record<string, unknown> = {
      '@type': 'NewsArticle',
      '@id': `${this.origen}/novedades/${n.slug}#nota`,
      headline: n.titulo,
      description: n.bajada ?? n.titulo,
      inLanguage: 'es-AR',
      mainEntityOfPage: { '@type': 'WebPage', '@id': `${this.origen}/novedades/${n.slug}` },
      publisher: { '@id': `${this.origen}/#organizacion` },
      /*
        La nota la firma la entidad, no la persona que la cargó en el panel: es
        comunicación institucional y así se muestra también en el sitio.
      */
      author: { '@id': `${this.origen}/#organizacion` },
    };

    if (n.publicadaEn) {
      datos['datePublished'] = n.publicadaEn;
      datos['dateModified'] = n.publicadaEn;
    }
    if (n.portada?.original) datos['image'] = this.absoluta(n.portada.original);
    if (n.categoria) datos['articleSection'] = n.categoria.nombre;

    return datos;
  }

  /**
   * El camino desde el inicio hasta la página actual.
   *
   * Es lo que Google muestra arriba del título en el resultado, en vez de la
   * dirección cruda.
   */
  migas(tramos: readonly { readonly nombre: string; readonly ruta: string }[]): Record<string, unknown> {
    return {
      '@type': 'BreadcrumbList',
      itemListElement: [{ nombre: 'Inicio', ruta: '/' }, ...tramos].map((t, i) => ({
        '@type': 'ListItem',
        position: i + 1,
        name: t.nombre,
        item: `${this.origen}${t.ruta}`,
      })),
    };
  }

  /**
   * Deja en la página exactamente estos bloques, y saca los anteriores.
   *
   * Van todos juntos en un `@graph`, que es la forma de decir «estas cosas son
   * del mismo documento y se refieren entre sí»; por eso cada una lleva su `@id`
   * y las demás la mencionan en vez de repetirla entera.
   */
  publicar(bloques: readonly Record<string, unknown>[]): void {
    this.limpiar();
    if (bloques.length === 0) return;

    const guion = this.documento.createElement('script');
    guion.type = 'application/ld+json';
    guion.id = ID_BLOQUE;
    guion.textContent = JSON.stringify({
      '@context': 'https://schema.org',
      '@graph': bloques,
    });
    this.documento.head.appendChild(guion);
  }

  private limpiar(): void {
    this.documento.getElementById(ID_BLOQUE)?.remove();
  }

  private absoluta(valor: string): string {
    if (/^https?:\/\//i.test(valor)) return valor;
    return `${this.origen}${valor.startsWith('/') ? '' : '/'}${valor}`;
  }
}
