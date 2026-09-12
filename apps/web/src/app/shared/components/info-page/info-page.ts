import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { Title } from '@angular/platform-browser';
import type { PaginaInfo } from '@cirsub/shared';
import { ContenidoService } from '../../../core/servicios/contenido.service';
import { IconIllustration } from '../icon-illustration/icon-illustration';
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
  imports: [CommonModule, RouterLink, IconIllustration],
  templateUrl: './info-page.html',
  styleUrl: './info-page.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InfoPage implements OnInit {
  private readonly ruta = inject(ActivatedRoute);
  private readonly contenido = inject(ContenidoService);
  private readonly titulo = inject(Title);

  readonly pagina = signal<PaginaInfo | null>(null);
  readonly cargando = signal(true);
  readonly noEncontrada = signal(false);

  ngOnInit(): void {
    this.ruta.paramMap.subscribe((params) => {
      // El alojamiento tiene ruta propia y trae el slug en los datos de la ruta.
      const slug = params.get('slug') ?? (this.ruta.snapshot.data['slug'] as string | undefined);
      if (!slug) {
        this.noEncontrada.set(true);
        this.cargando.set(false);
        return;
      }

      this.cargando.set(true);
      this.noEncontrada.set(false);

      this.contenido.pagina(slug).subscribe({
        next: (p) => {
          this.pagina.set(p);
          this.cargando.set(false);
          this.titulo.setTitle(`${p.titulo} · CIRSUB`);
        },
        error: () => {
          this.noEncontrada.set(true);
          this.cargando.set(false);
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
