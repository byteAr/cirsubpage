import { CommonModule, isPlatformBrowser } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  OnDestroy,
  OnInit,
  PLATFORM_ID,
  computed,
  effect,
  inject,
  input,
  signal,
  untracked,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import type { SlideCarrusel } from '@cirsub/shared';

/**
 * Carrusel de portada.
 *
 * Cada diapositiva es el resumen de una novedad: imagen sin texto embebido,
 * volanta, título y bajada cargados aparte. Al tocarla se llega a la nota
 * completa.
 *
 * El avance es automático y se ve venir: la marca de la diapositiva actual se
 * llena mientras corre el tiempo y, al completarse, pasa a la siguiente. El
 * reloj va en un `requestAnimationFrame` en vez de un `setInterval` porque la
 * barra y el salto tienen que salir del mismo cálculo; con dos relojes
 * separados se desincronizan apenas el usuario pausa o adelanta.
 */
@Component({
  selector: 'app-carrusel-novedades',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './carrusel-novedades.html',
  styleUrl: './carrusel-novedades.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CarruselNovedades implements OnInit, OnDestroy {
  private readonly plataforma = inject(PLATFORM_ID);

  readonly slides = input.required<readonly SlideCarrusel[]>();
  readonly intervalo = input(7000);

  readonly indice = signal(0);
  readonly pausado = signal(false);

  /** De 0 a 1: cuánto le falta a la diapositiva actual para dar paso. */
  readonly progreso = signal(0);

  readonly actual = computed(() => this.slides()[this.indice()] ?? null);

  /**
   * Lista de un solo elemento. Al llevar `track` por id, Angular rehace el
   * nodo en cada cambio y las animaciones de entrada vuelven a correr; si se
   * reutilizara el mismo nodo, el texto y la imagen cambiarían de golpe.
   */
  readonly visible = computed(() => {
    const slide = this.actual();
    return slide ? [slide] : [];
  });

  readonly contador = computed(() => {
    const total = this.slides().length;
    return `${String(this.indice() + 1).padStart(2, '0')} / ${String(total).padStart(2, '0')}`;
  });

  /** Marca de tiempo en la que arrancó el tramo actual. */
  private arranque = 0;
  private ultimoCuadro = 0;
  private cuadro = 0;
  private inicioTacto = 0;

  private readonly latir = (ahora: number): void => {
    const duracion = this.intervalo();

    /*
      El navegador no entrega cuadros mientras la pestaña está oculta. Al
      volver, el reloj marcaría de golpe todo el tiempo ausente y el carrusel
      saltaría de diapositiva apenas el asociado regresa. Un hueco largo se lee
      como una vuelta: se retoma donde había quedado la barra.
    */
    if (this.ultimoCuadro && ahora - this.ultimoCuadro > 1000) {
      this.arranque = ahora - this.progreso() * duracion;
    }
    this.ultimoCuadro = ahora;

    const avance = Math.min(1, (ahora - this.arranque) / duracion);

    // Un centésimo de barra es menos de un píxel: por debajo de eso no vale
    // la pena despertar la detección de cambios.
    if (Math.abs(avance - this.progreso()) >= 0.01 || avance === 1) {
      this.progreso.set(avance);
    }

    if (avance >= 1) {
      this.avanzar(1);
      this.arranque = ahora;
      this.progreso.set(0);
    }

    this.cuadro = requestAnimationFrame(this.latir);
  };

  /** Queda en falso si el asociado pidió menos movimiento, o si no hay navegador. */
  private animable = false;

  constructor() {
    /*
      Las diapositivas llegan por HTTP después de que el componente se crea, así
      que al iniciarse la lista suele venir vacía. Si el reloj se armara sólo en
      `ngOnInit`, saldría sin diapositivas, se cortaría en la guarda de «menos de
      dos» y no volvería a intentarlo nunca: la barra quedaba en cero y el
      carrusel no pasaba solo.

      Con esto se arma en cuanto la lista llega. Lo único que se observa es la
      cantidad de diapositivas; el resto va en `untracked` para que el efecto no
      se vuelva a disparar por el propio reloj.
    */
    effect(() => {
      const total = this.slides().length;

      untracked(() => {
        if (!this.animable || total < 2) {
          this.detener();
          return;
        }
        // Si ya viene corriendo no se reinicia: cortaría la barra a la mitad.
        if (!this.cuadro && !this.pausado()) this.arrancar();
      });
    });
  }

  ngOnInit(): void {
    if (!isPlatformBrowser(this.plataforma)) return;
    this.animable = !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (this.animable) this.arrancar();
  }

  ngOnDestroy(): void {
    this.detener();
  }

  siguiente(): void {
    this.avanzar(1);
    this.reiniciar();
  }

  anterior(): void {
    this.avanzar(-1);
    this.reiniciar();
  }

  irA(i: number): void {
    this.indice.set(i);
    this.reiniciar();
  }

  /** Al pasar el puntero se detiene: nadie quiere que la diapositiva se mueva mientras lee. */
  pausar(): void {
    this.pausado.set(true);
    this.detener();
  }

  /** Al irse el puntero la barra sigue desde donde quedó, no vuelve a cero. */
  reanudar(): void {
    this.pausado.set(false);
    this.correr(this.progreso());
  }

  alTocarInicio(evento: TouchEvent): void {
    this.inicioTacto = evento.changedTouches[0]?.clientX ?? 0;
  }

  alTocarFin(evento: TouchEvent): void {
    const fin = evento.changedTouches[0]?.clientX ?? 0;
    const desplazamiento = fin - this.inicioTacto;
    if (Math.abs(desplazamiento) < 48) return;
    desplazamiento < 0 ? this.siguiente() : this.anterior();
  }

  /** Cuánto lleva cargada la marca de la diapositiva `i`. */
  relleno(i: number): number {
    return i === this.indice() ? this.progreso() : 0;
  }

  private avanzar(paso: number): void {
    const total = this.slides().length;
    if (total === 0) return;
    this.indice.update((i) => (i + paso + total) % total);
  }

  private arrancar(): void {
    this.correr(0);
  }

  /** Pone el reloj a correr desde el punto indicado de la barra. */
  private correr(desde: number): void {
    if (!isPlatformBrowser(this.plataforma)) return;
    this.detener();
    if (this.slides().length < 2) return;
    this.arranque = performance.now() - desde * this.intervalo();
    this.ultimoCuadro = 0;
    this.progreso.set(desde);
    this.cuadro = requestAnimationFrame(this.latir);
  }

  private reiniciar(): void {
    if (this.pausado()) {
      this.progreso.set(0);
      return;
    }
    this.arrancar();
  }

  private detener(): void {
    if (this.cuadro) cancelAnimationFrame(this.cuadro);
    this.cuadro = 0;
  }
}
