import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import {
  MARCA_FILIALES_CON_HOTEL,
  textoFilialesConHotel,
  tieneHotel,
  type PaginaInfo,
} from '@cirsub/shared';
import { prepararNoEncontrado } from '../../../core/respuesta-no-encontrada';
import { Seo } from '../../../core/servicios/seo.service';
import { DatosEstructurados } from '../../../core/servicios/datos-estructurados.service';
import { ContenidoService } from '../../../core/servicios/contenido.service';
import { IconIllustration } from '../icon-illustration/icon-illustration';
import { CabeceraPagina } from '../cabecera-pagina/cabecera-pagina';
import { TablaValoresSepelio } from '../valores-sepelio/valores-sepelio';
import { HotelesFiliales } from '../hoteles-filiales/hoteles-filiales';
import type { IconoServicio } from '../../../core/models';

/**
 * Plantilla única de página informativa.
 *
 * Sirve para los servicios, el alojamiento y los recibos. El
 * contenido viene de la base en bloques declarativos, así que sumar una página
 * nueva no toca código.
 */
@Component({
  selector: 'app-info-page',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    IconIllustration,
    CabeceraPagina,
    TablaValoresSepelio,
    HotelesFiliales,
  ],
  templateUrl: './info-page.html',
  styleUrl: './info-page.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InfoPage implements OnInit {
  private readonly ruta = inject(ActivatedRoute);
  private readonly contenido = inject(ContenidoService);
  private readonly seo = inject(Seo);
  private readonly estructurados = inject(DatosEstructurados);
  private readonly rutaActual = inject(Router);

  readonly pagina = signal<PaginaInfo | null>(null);
  readonly cargando = signal(true);
  readonly noEncontrada = signal(false);
  private readonly marcarNoEncontrado = prepararNoEncontrado();

  ngOnInit(): void {
    this.ruta.paramMap.subscribe((params) => {
      // El alojamiento tiene ruta propia y trae el slug en los datos de la ruta.
      const slug =
        params.get('slug') ??
        (this.ruta.snapshot.data['slug'] as string | undefined);
      if (!slug) {
        this.noEncontrada.set(true);
        this.cargando.set(false);
        this.marcarNoEncontrado();
        return;
      }

      this.cargando.set(true);
      this.noEncontrada.set(false);

      this.contenido.pagina(slug).subscribe({
        next: (p) => {
          if (!JSON.stringify(p.bloques).includes(MARCA_FILIALES_CON_HOTEL)) {
            this.mostrar(p);
            return;
          }
          // Se espera la cuenta para no mostrar primero un texto y después otro.
          this.contenido.filiales().subscribe((filiales) =>
            this.mostrar(conFilialesConHotel(p, filiales.filter(tieneHotel).length)),
          );
        },
        error: () => {
          this.noEncontrada.set(true);
          this.cargando.set(false);
          this.marcarNoEncontrado();
        },
      });
    });
  }

  private mostrar(p: PaginaInfo): void {
    this.pagina.set(p);
    this.cargando.set(false);
    /*
      El camino cambia según de dónde cuelgue la página: las de servicio van
      bajo «Servicios» y las de trámite bajo «Trámites». Se toma de la
      dirección en vez de del tipo para que coincida con lo que el visitante
      recorrió.
    */
    const bajoTramites = this.rutaActual.url.startsWith('/tramites');
    this.estructurados.publicar([
      this.estructurados.organizacion(),
      this.estructurados.sitio(),
      this.estructurados.migas([
        bajoTramites
          ? { nombre: 'Trámites', ruta: '/tramites' }
          : { nombre: 'Servicios', ruta: '/beneficios' },
        { nombre: p.titulo, ruta: this.rutaActual.url.split('?')[0] },
      ]),
    ]);

    this.seo.aplicar({
      titulo: p.titulo,
      descripcion:
        p.subtitulo ??
        `${p.titulo}: requisitos, documentación y cómo gestionarlo ante la Mutual del Círculo de Suboficiales de Gendarmería Nacional.`,
      imagen: p.imagenUrl,
    });
  }

  /**
   * En qué bloque va la tabla de valores del subsidio por sepelio: antes del
   * primer título, que es el de contacto, para que quede pegada al párrafo del
   * reintegro que la explica. -1 en las demás páginas.
   */
  readonly posicionValoresSepelio = computed(() => {
    const p = this.pagina();
    if (p?.slug !== 'subsidio-sepelio') return -1;
    const titulo = p.bloques.findIndex((b) => b.tipo === 'TITULO');
    return titulo === -1 ? p.bloques.length : titulo;
  });

  /** La ruta de vuelta depende de si es un servicio o un trámite. */
  rutaIndice(): string {
    const tipo = this.pagina()?.tipo;
    if (tipo === 'TRAMITE') return '/tramites';
    if (tipo === 'SERVICIO') return '/beneficios';
    return '/';
  }

  etiquetaIndice(): string {
    const tipo = this.pagina()?.tipo;
    if (tipo === 'TRAMITE') return 'Trámites';
    if (tipo === 'SERVICIO') return 'Servicios';
    return 'Inicio';
  }

  /**
   * Los bloques llegan de la base como HTML, así que sus enlaces son `<a>` comunes
   * y no `routerLink`: sin esto, un enlace a otra página del sitio recarga todo
   * de cero. Se deja al navegador lo que le toca a él: abrir en otra pestaña, las
   * teclas modificadoras y los enlaces a otros dominios.
   */
  navegarInterno(evento: MouseEvent): void {
    if (
      evento.defaultPrevented ||
      evento.button !== 0 ||
      evento.ctrlKey ||
      evento.metaKey ||
      evento.shiftKey ||
      evento.altKey
    ) {
      return;
    }
    const enlace = (evento.target as Element | null)?.closest('a');
    if (!enlace || enlace.target) return;
    const destino = enlace.getAttribute('href');
    if (!destino?.startsWith('/') || destino.startsWith('//')) return;
    evento.preventDefault();
    void this.rutaActual.navigateByUrl(destino);
  }

  comoIcono(valor: string | null): IconoServicio | null {
    return (valor as IconoServicio) ?? null;
  }
}

/** La página con la marca de filiales con hotel cambiada por la cuenta real. */
function conFilialesConHotel(pagina: PaginaInfo, cantidad: number): PaginaInfo {
  const texto = textoFilialesConHotel(cantidad);
  const reemplazar = (v: string) => v.replaceAll(MARCA_FILIALES_CON_HOTEL, texto);
  return {
    ...pagina,
    bloques: pagina.bloques.map((b) => ({
      ...b,
      contenido: b.contenido === null ? null : reemplazar(b.contenido),
      items: b.items === null ? null : b.items.map(reemplazar),
    })),
  };
}
