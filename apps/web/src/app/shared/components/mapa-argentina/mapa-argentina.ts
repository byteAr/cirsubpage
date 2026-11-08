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
 * desfase escalona los diecinueve pines para que no repinten todos juntos.
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
  readonly logo = input('cirsublogo-chico.webp');

  readonly elegida = output<Filial>();

  readonly activa = signal<string | null>(null);
  /*
    Arranca quieto y lo enciende el observador cuando el mapa entra en pantalla.

    Antes arrancaba andando, así que el HTML del servidor ya traía las diecinueve
    animaciones en marcha y recién se apagaban cuando el componente cobraba vida.
    Con la hidratación diferida eso dejó de pasar nunca durante la carga: diecinueve
    pulsos infinitos latiendo mientras el navegador todavía está armando la
    página, muy por debajo del pliegue, donde nadie los ve.
  */
  readonly animando = signal(false);

  readonly ancho = 530;
  readonly alto = 1087;
  readonly mapa = 'mapa_argentina-B8OxrHMv.svg';

  /**
   * Coeficientes que llevan latitud y longitud a las coordenadas del dibujo.
   *
   * El dibujo no sigue una proyección: en el norte los paralelos son rectos y
   * parejos, pero en el sur vienen inclinados y Tierra del Fuego está comprimida.
   * Por eso se usa un polinomio de grado 3, ajustado superponiendo los límites
   * reales de las provincias (public/ar.svg, en Mercator y con puntos de latitud y
   * longitud conocidos) sobre los límites de este dibujo. El error medio es de unos
   * 2 píxeles en un dibujo de 1087 de alto. Las 19 filiales caen en su provincia.
   *
   * Vale para el territorio continental: no sirve para Tierra del Fuego, que acá
   * está fuera de escala. Si se cambia el dibujo, hay que volver a calibrarlo.
   */
  private readonly cx = [
    238.9615, -5.9067, -3.4566, 7.8644, 273.6947, 58.714, -17.5091, -1.7274, 16.7927, 2.9863,
  ] as const;
  private readonly cy = [
    474.5619, -492.3469, -1.9277, -8.2291, -4.3746, -2.3681, 12.8421, 18.1902, -13.2753, 5.9099,
  ] as const;

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

  /** Posición del pin en el dibujo. Sale siempre de la ubicación real de la filial. */
  posicion(filial: Filial): { x: number; y: number } {
    const lng = (filial.lng + 63) / 10;
    const lat = (filial.lat + 36) / 15;

    // Términos lngⁱ·latʲ con i + j ≤ 3, en el mismo orden en que se ajustaron.
    const terminos: number[] = [];
    for (let i = 0; i <= 3; i++) {
      for (let j = 0; j <= 3 - i; j++) terminos.push(lng ** i * lat ** j);
    }

    const evaluar = (c: readonly number[]) =>
      Math.round(terminos.reduce((s, v, k) => s + v * c[k]!, 0) * 10) / 10;

    return { x: evaluar(this.cx), y: evaluar(this.cy) };
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
