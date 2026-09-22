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
import { CalculadoraPrestamo } from '../../../../shared/components/calculadora-prestamo/calculadora-prestamo';
import { DatosEstructurados } from '../../../../core/servicios/datos-estructurados.service';
import { ContenidoService } from '../../../../core/servicios/contenido.service';

/**
 * Piezas que se pueden insertar dentro del cuerpo de una novedad escribiendo su
 * marca en un párrafo propio, desde el editor del panel: `[calculadora-prestamos]`.
 *
 * El cuerpo es HTML que viene de la base, así que ahí no se puede poner un
 * componente. En cambio se lo parte en la marca y el componente va entre los
 * dos pedazos. Quien arma la nota decide dónde aparece, sin tocar código.
 */
const PIEZAS = ['calculadora-prestamos'] as const;
type Pieza = (typeof PIEZAS)[number];

type Segmento = { readonly tipo: 'html'; readonly html: SafeHtml } | { readonly tipo: Pieza };
type SegmentoCrudo = { readonly tipo: 'html'; readonly html: string } | { readonly tipo: Pieza };

/*
  La marca, sola en su párrafo —como la deja el editor— o suelta. Los espacios
  duros que mete el editor al pegar texto también cuentan como espacio.
*/
const MARCA = /<p>(?:\s|&nbsp;)*\[(calculadora-prestamos)\](?:\s|&nbsp;)*<\/p>|\[(calculadora-prestamos)\]/gi;

export function partirCuerpo(html: string): SegmentoCrudo[] {
  const segmentos: SegmentoCrudo[] = [];
  let desde = 0;

  for (const m of html.matchAll(MARCA)) {
    const antes = html.slice(desde, m.index);
    if (antes.trim()) segmentos.push({ tipo: 'html', html: antes });
    segmentos.push({ tipo: (m[1] ?? m[2]).toLowerCase() as Pieza });
    desde = m.index! + m[0].length;
  }

  const resto = html.slice(desde);
  if (resto.trim()) segmentos.push({ tipo: 'html', html: resto });
  return segmentos;
}

@Component({
  selector: 'app-novedad-detalle',
  standalone: true,
  imports: [CommonModule, RouterLink, CalculadoraPrestamo],
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
  readonly segmentos = signal<readonly Segmento[]>([]);
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
          this.segmentos.set(
            partirCuerpo(n.cuerpoHtml).map((s) =>
              s.tipo === 'html'
                ? { tipo: 'html', html: this.sanitizador.bypassSecurityTrustHtml(s.html) }
                : s,
            ),
          );
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
