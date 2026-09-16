import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  inject,
  signal,
} from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import type { PaginaInfo } from '@cirsub/shared';
import { prepararNoEncontrado } from '../../../core/respuesta-no-encontrada';
import { Seo } from '../../../core/servicios/seo.service';
import { DatosEstructurados } from '../../../core/servicios/datos-estructurados.service';
import { ContenidoService } from '../../../core/servicios/contenido.service';
import { IconIllustration } from '../icon-illustration/icon-illustration';
import { CabeceraPagina } from '../cabecera-pagina/cabecera-pagina';
import type { IconoServicio } from '../../../core/models';

/**
 * Plantilla única de página informativa.
 *
 * Sirve para los nueve servicios, los tres trámites y el alojamiento. El
 * contenido viene de la base en bloques declarativos, así que sumar una página
 * nueva no toca código.
 */
@Component({
  selector: 'app-info-page',
  standalone: true,
  imports: [CommonModule, RouterLink, IconIllustration, CabeceraPagina],
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
        },
        error: () => {
          this.noEncontrada.set(true);
          this.cargando.set(false);
          this.marcarNoEncontrado();
        },
      });
    });
  }

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

  comoIcono(valor: string | null): IconoServicio | null {
    return (valor as IconoServicio) ?? null;
  }
}
