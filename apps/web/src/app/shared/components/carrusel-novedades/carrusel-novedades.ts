import { CommonModule, isPlatformBrowser } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  OnInit,
  PLATFORM_ID,
  computed,
  inject,
  input,
  signal,
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
 * llena mientras corre el tiempo y, al completarse, pasa a la siguiente.
 *
 * Quien lleva el tiempo es el navegador, con una animación CSS sobre la marca
 * activa; el componente sólo escucha el final. Antes lo llevaba un reloj propio
 * que escribía el avance en una señal cuadro por cuadro: sesenta ciclos de
 * detección de cambios por segundo, durante toda la visita, para mover una
 * barra de cuarenta píxeles. Era la parte más cara de la portada.
 *
 * Lo que el reloj propio resolvía a mano ahora sale gratis: al pasar el puntero
 * la animación se pausa y al irse sigue desde donde quedó, porque eso es lo que
 * hace `animation-play-state`.
 */
@Component({
  selector: 'app-carrusel-novedades',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './carrusel-novedades.html',
  styleUrl: './carrusel-novedades.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CarruselNovedades implements OnInit {
  private readonly plataforma = inject(PLATFORM_ID);
  private readonly alDestruir = inject(DestroyRef);

  readonly slides = input.required<readonly SlideCarrusel[]>();
  readonly intervalo = input(7000);

  readonly indice = signal(0);

  /*
    Dos motivos distintos para frenar, cada uno con su señal.

    Juntarlos en una sola bandera hacía que al sacar el puntero de encima el
    carrusel no volviera a arrancar si la pestaña estaba de fondo, y peor: que
    al volver a la pestaña arrancara aunque el puntero siguiera encima de una
    novedad que el asociado estaba leyendo.
  */
  private readonly punteroEncima = signal(false);
  private readonly pestanaOculta = signal(false);

  readonly detenido = computed(() => this.punteroEncima() || this.pestanaOculta());

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

  /** Con una sola diapositiva no hay a dónde pasar. */
  readonly avanzaSolo = computed(() => this.slides().length > 1);

  private inicioTacto = 0;

  ngOnInit(): void {
    if (!isPlatformBrowser(this.plataforma)) return;

    /*
      Con la pestaña de fondo el navegador sigue corriendo las animaciones CSS
      aunque no dibuje nada. Sin esto, el asociado que vuelve después de un rato
      se encuentra el carrusel varias novedades más adelante, o saltando.
    */
    const alCambiarVisibilidad = (): void => this.pestanaOculta.set(document.hidden);
    alCambiarVisibilidad();
    document.addEventListener('visibilitychange', alCambiarVisibilidad);
    this.alDestruir.onDestroy(() =>
      document.removeEventListener('visibilitychange', alCambiarVisibilidad),
    );
  }

  /** La marca terminó de llenarse: pasa la siguiente. */
  alCompletar(): void {
    this.avanzar(1);
  }

  siguiente(): void {
    this.avanzar(1);
  }

  anterior(): void {
    this.avanzar(-1);
  }

  irA(i: number): void {
    this.indice.set(i);
  }

  /** Al pasar el puntero se detiene: nadie quiere que la diapositiva se mueva mientras lee. */
  pausar(): void {
    this.punteroEncima.set(true);
  }

  /** Al irse el puntero la barra sigue desde donde quedó, no vuelve a cero. */
  reanudar(): void {
    this.punteroEncima.set(false);
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

  private avanzar(paso: number): void {
    const total = this.slides().length;
    if (total === 0) return;
    this.indice.update((i) => (i + paso + total) % total);
  }
}
