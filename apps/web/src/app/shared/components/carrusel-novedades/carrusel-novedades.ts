import { CommonModule, isPlatformBrowser } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  OnDestroy,
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

  readonly actual = computed(() => this.slides()[this.indice()] ?? null);
  readonly contador = computed(() => {
    const total = this.slides().length;
    return `${String(this.indice() + 1).padStart(2, '0')} / ${String(total).padStart(2, '0')}`;
  });

  private temporizador?: ReturnType<typeof setInterval>;
  private inicioTacto = 0;

  ngOnInit(): void {
    if (!isPlatformBrowser(this.plataforma)) return;
    const reducido = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (!reducido) this.arrancar();
  }

  ngOnDestroy(): void {
    this.detener();
  }

  siguiente(): void {
    const total = this.slides().length;
    if (total === 0) return;
    this.indice.update((i) => (i + 1) % total);
    this.reiniciar();
  }

  anterior(): void {
    const total = this.slides().length;
    if (total === 0) return;
    this.indice.update((i) => (i - 1 + total) % total);
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

  reanudar(): void {
    this.pausado.set(false);
    this.arrancar();
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

  private arrancar(): void {
    if (!isPlatformBrowser(this.plataforma)) return;
    this.detener();
    if (this.slides().length < 2) return;
    this.temporizador = setInterval(() => {
      this.indice.update((i) => (i + 1) % this.slides().length);
    }, this.intervalo());
  }

  private reiniciar(): void {
    if (!this.pausado()) this.arrancar();
  }

  private detener(): void {
    if (this.temporizador) clearInterval(this.temporizador);
    this.temporizador = undefined;
  }
}
