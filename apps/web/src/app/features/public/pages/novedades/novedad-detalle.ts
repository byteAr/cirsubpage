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
import { DomSanitizer, type SafeHtml } from '@angular/platform-browser';
import { ActivatedRoute, RouterLink } from '@angular/router';
import type { NovedadDetalle as Detalle } from '@cirsub/shared';
import { prepararNoEncontrado } from '../../../../core/respuesta-no-encontrada';
import { Seo } from '../../../../core/servicios/seo.service';
import { DatosEstructurados } from '../../../../core/servicios/datos-estructurados.service';
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
  private readonly seo = inject(Seo);
  private readonly estructurados = inject(DatosEstructurados);
  private readonly plataforma = inject(PLATFORM_ID);

  readonly novedad = signal<Detalle | null>(null);
  readonly cuerpo = signal<SafeHtml | null>(null);
  readonly cargando = signal(true);
  readonly noEncontrada = signal(false);
  private readonly marcarNoEncontrado = prepararNoEncontrado();
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
          this.marcarNoEncontrado();
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
    this.seo.aplicar({
      titulo: n.titulo,
      /*
        La bajada es lo que se escribió para que a la nota le den ganas de
        entrar, así que es la mejor descripción posible. Google recorta cerca de
        los 160 caracteres y prefiere una frase entera a una cortada al medio.
      */
      descripcion: n.bajada ?? `${n.titulo}. Novedades de la Mutual del Círculo de Suboficiales de Gendarmería Nacional.`,
      imagen: n.portada?.original ?? null,
      tipo: 'article',
      canonica: `/novedades/${n.slug}`,
      publicadaEn: n.publicadaEn,
      seccion: n.categoria?.nombre ?? null,
    });

    this.estructurados.publicar([
      this.estructurados.organizacion(),
      this.estructurados.sitio(),
      this.estructurados.novedad(n),
      this.estructurados.migas([
        { nombre: 'Novedades', ruta: '/novedades' },
        { nombre: n.titulo, ruta: `/novedades/${n.slug}` },
      ]),
    ]);
  }
}
