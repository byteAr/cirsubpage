import { CommonModule, isPlatformBrowser } from '@angular/common';
import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  OnDestroy,
  OnInit,
  PLATFORM_ID,
  inject,
  signal,
} from '@angular/core';
import { DomSanitizer, Meta, Title, type SafeHtml } from '@angular/platform-browser';
import { ActivatedRoute, RouterLink } from '@angular/router';
import type { NovedadDetalle as Detalle } from '@cirsub/shared';
import { ContenidoService } from '../../../../core/servicios/contenido.service';

@Component({
  selector: 'app-novedad-detalle',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './novedad-detalle.html',
  styleUrl: './novedad-detalle.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NovedadDetalle implements OnInit, AfterViewInit, OnDestroy {
  private readonly ruta = inject(ActivatedRoute);
  private readonly contenido = inject(ContenidoService);
  private readonly sanitizador = inject(DomSanitizer);
  private readonly titulo = inject(Title);
  private readonly meta = inject(Meta);
  private readonly plataforma = inject(PLATFORM_ID);

  readonly novedad = signal<Detalle | null>(null);
  readonly cuerpo = signal<SafeHtml | null>(null);
  readonly cargando = signal(true);
  readonly noEncontrada = signal(false);
  readonly progreso = signal(0);
  readonly copiado = signal(false);

  private readonly alDesplazar = (): void => {
    const alto = document.documentElement.scrollHeight - window.innerHeight;
    this.progreso.set(alto > 0 ? Math.min(100, (window.scrollY / alto) * 100) : 0);
  };

  ngOnInit(): void {
    this.ruta.paramMap.subscribe((params) => {
      const slug = params.get('slug');
      if (!slug) return;

      this.cargando.set(true);
      this.noEncontrada.set(false);

      this.contenido.novedad(slug).subscribe({
        next: (n) => {
          this.novedad.set(n);
          // El cuerpo ya viene saneado del backend con lista blanca estricta;
          // acá solo se marca como confiable para que Angular lo pinte.
          this.cuerpo.set(this.sanitizador.bypassSecurityTrustHtml(n.cuerpoHtml));
          this.cargando.set(false);
          this.aplicarMetadatos(n);
        },
        error: () => {
          this.noEncontrada.set(true);
          this.cargando.set(false);
        },
      });
    });
  }

  ngAfterViewInit(): void {
    if (!isPlatformBrowser(this.plataforma)) return;
    window.addEventListener('scroll', this.alDesplazar, { passive: true });
  }

  ngOnDestroy(): void {
    if (!isPlatformBrowser(this.plataforma)) return;
    window.removeEventListener('scroll', this.alDesplazar);
  }

  async compartir(): Promise<void> {
    if (!isPlatformBrowser(this.plataforma)) return;
    const n = this.novedad();
    if (!n) return;

    const datos = { title: n.titulo, text: n.bajada ?? '', url: window.location.href };

    // En el teléfono se abre el menú del sistema; en escritorio se copia el enlace.
    if (navigator.share) {
      try {
        await navigator.share(datos);
        return;
      } catch {
        return;
      }
    }

    await navigator.clipboard.writeText(window.location.href);
    this.copiado.set(true);
    setTimeout(() => this.copiado.set(false), 2200);
  }

  private aplicarMetadatos(n: Detalle): void {
    this.titulo.setTitle(`${n.titulo} · CIRSUB`);
    const descripcion = n.bajada ?? 'Novedades de la Mutual del Círculo de Suboficiales.';
    this.meta.updateTag({ name: 'description', content: descripcion });
    this.meta.updateTag({ property: 'og:title', content: n.titulo });
    this.meta.updateTag({ property: 'og:description', content: descripcion });
    this.meta.updateTag({ property: 'og:type', content: 'article' });
    if (n.portada?.original) {
      this.meta.updateTag({ property: 'og:image', content: n.portada.original });
    }
  }
}
