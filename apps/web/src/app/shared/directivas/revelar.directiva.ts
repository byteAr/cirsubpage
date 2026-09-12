import {
  Directive,
  ElementRef,
  OnDestroy,
  OnInit,
  PLATFORM_ID,
  inject,
  input,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

/**
 * Revela el elemento cuando entra en pantalla.
 *
 * Se desconecta después de revelar: una vez visible no hace falta seguir
 * observando. En el servidor no hace nada, y el CSS deja el elemento visible
 * si el visitante pidió movimiento reducido.
 */
@Directive({ selector: '[appRevelar]', standalone: true })
export class RevelarDirectiva implements OnInit, OnDestroy {
  private readonly elemento = inject(ElementRef<HTMLElement>);
  private readonly plataforma = inject(PLATFORM_ID);

  /** Retardo en milisegundos, para escalonar los elementos de una grilla. */
  readonly appRevelar = input<number | ''>('');

  private observador?: IntersectionObserver;

  ngOnInit(): void {
    const nodo = this.elemento.nativeElement;

    if (!isPlatformBrowser(this.plataforma)) return;

    const reducido = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reducido) {
      nodo.classList.add('visible');
      return;
    }

    nodo.setAttribute('data-revelar', '');

    const retardo = Number(this.appRevelar()) || 0;
    if (retardo > 0) nodo.style.transitionDelay = `${retardo}ms`;

    this.observador = new IntersectionObserver(
      (entradas) => {
        for (const entrada of entradas) {
          if (!entrada.isIntersecting) continue;
          entrada.target.classList.add('visible');
          this.observador?.unobserve(entrada.target);
        }
      },
      { threshold: 0.12, rootMargin: '0px 0px -40px 0px' },
    );

    this.observador.observe(nodo);
  }

  ngOnDestroy(): void {
    this.observador?.disconnect();
  }
}
