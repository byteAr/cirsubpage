import { CommonModule, isPlatformBrowser } from '@angular/common';
import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  OnDestroy,
  PLATFORM_ID,
  inject,
  input,
  output,
  signal,
  viewChild,
} from '@angular/core';
import type { Filial } from '@cirsub/shared';

/**
 * Mapa de Argentina con un pin por filial.
 *
 * El pulso infinito alrededor de cada pin es lo único que se conserva tal cual
 * del sitio anterior: la animación es CSS sobre `transform` y `opacity`, que el
 * navegador compone sin recalcular la geometría del SVG en cada cuadro. El
 * desfase escalona los veinte pines para que no repinten todos juntos.
 *
 * Fuera de pantalla la animación se pausa: no tiene sentido gastar cuadros en
 * algo que nadie está viendo.
 */
@Component({
  selector: 'app-mapa-argentina',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './mapa-argentina.html',
  styleUrl: './mapa-argentina.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MapaArgentina implements AfterViewInit, OnDestroy {
  private readonly plataforma = inject(PLATFORM_ID);
  private readonly contenedor = viewChild.required<ElementRef<HTMLElement>>('contenedor');

  readonly filiales = input.required<readonly Filial[]>();
  readonly interactivo = input(false);
  readonly logo = input('cirsublogo.png');

  readonly elegida = output<Filial>();

  readonly activa = signal<string | null>(null);
  readonly animando = signal(true);

  readonly ancho = 530;
  readonly alto = 1087;
  readonly mapa = 'mapa_argentina-B8OxrHMv.svg';

  /** Recuadro geográfico del dibujo, usado para proyectar latitud y longitud. */
  private readonly limites = { norte: -21.8, sur: -55.0, este: -53.6, oeste: -73.6 };

  private observador?: IntersectionObserver;

  ngAfterViewInit(): void {
    if (!isPlatformBrowser(this.plataforma)) return;

    this.observador = new IntersectionObserver(
      ([entrada]) => this.animando.set(entrada?.isIntersecting ?? false),
      { threshold: 0.05 },
    );
    this.observador.observe(this.contenedor().nativeElement);
  }

  ngOnDestroy(): void {
    this.observador?.disconnect();
  }

  /** Posición del pin. Si la filial trae corrección manual, gana sobre la proyección. */
  posicion(filial: Filial): { x: number; y: number } {
    if (filial.svgX != null && filial.svgY != null) {
      return { x: filial.svgX, y: filial.svgY };
    }

    const rangoLat = this.limites.norte - this.limites.sur;
    const rangoLng = this.limites.este - this.limites.oeste;

    const normalLat = (filial.lat - this.limites.sur) / rangoLat;
    const normalLng = (filial.lng - this.limites.oeste) / rangoLng;

    const margen = 20;
    return {
      x: Math.round(margen + normalLng * (this.ancho - 2 * margen)),
      y: Math.round(margen + (1 - normalLat) * (this.alto - 2 * margen)),
    };
  }

  transformacion(filial: Filial): string {
    const { x, y } = this.posicion(filial);
    return `translate(${x}, ${y})`;
  }


  alElegir(filial: Filial): void {
    if (!this.interactivo()) return;
    this.elegida.emit(filial);
  }

  alEntrar(id: string): void {
    if (this.interactivo()) this.activa.set(id);
  }

  alSalir(): void {
    this.activa.set(null);
  }

  filialActiva(): Filial | null {
    const id = this.activa();
    return id ? (this.filiales().find((f) => f.id === id) ?? null) : null;
  }

  /** Mantiene el cartel dentro del dibujo cuando el pin está cerca de un borde. */
  posicionCartel(filial: Filial): { x: number; y: number } {
    const { x, y } = this.posicion(filial);
    const anchoCartel = 250;
    const altoCartel = 78;

    let dx = 30;
    let dy = -altoCartel - 14;

    if (x + anchoCartel + 30 > this.ancho) dx = -(anchoCartel + 30);
    if (y + dy < 10) dy = 30;

    return { x: x + dx, y: y + dy };
  }
}
