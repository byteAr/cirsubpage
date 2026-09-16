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
  readonly logo = input('cirsublogo-chico.webp');

  readonly elegida = output<Filial>();

  readonly activa = signal<string | null>(null);
  /*
    Arranca quieto y lo enciende el observador cuando el mapa entra en pantalla.

    Antes arrancaba andando, así que el HTML del servidor ya traía las veinte
    animaciones en marcha y recién se apagaban cuando el componente cobraba vida.
    Con la hidratación diferida eso dejó de pasar nunca durante la carga: veinte
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
   * El SVG no está dibujado en proyección plana, así que repartir la latitud y
   * la longitud en partes iguales sobre el ancho y el alto deja los pines
   * corridos: las ciudades de la costa terminaban en el mar y las del noreste
   * cruzaban al Paraguay.
   *
   * En su lugar se usa un modelo bilineal, que absorbe la convergencia de los
   * meridianos. Se ajustó midiendo los cuatro puntos extremos del contorno del
   * país dentro del propio SVG y atándolos a sus coordenadas reales. Con esto
   * caen dentro del territorio treinta y tres de las treinta y cinco ciudades
   * de prueba, y diecinueve de las veinte filiales.
   *
   *   x = cx0 + cx1·lng + cx2·lat + cx3·lng·lat
   *   y = cy0 + cy1·lng + cy2·lat + cy3·lng·lat
   */
  private readonly cx = [3265.027722, 47.044692, 40.019398, 0.598011] as const;
  private readonly cy = [407.203843, 16.221275, 7.380332, 0.574567] as const;

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

    const t = [1, filial.lng, filial.lat, filial.lng * filial.lat];
    return {
      x: Math.round(t.reduce((s, v, i) => s + v * this.cx[i]!, 0) * 10) / 10,
      y: Math.round(t.reduce((s, v, i) => s + v * this.cy[i]!, 0) * 10) / 10,
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
