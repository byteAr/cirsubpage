import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { TRAZOS_ONDA } from './trazos';

/**
 * Onda decorativa entre secciones.
 *
 * En `simple` dibuja una sola ola, para la cabecera y el pie. En `capas`
 * dibuja tres, cada una con su ritmo, su tono y su transparencia, de modo que
 * se ven pasar una sobre otra.
 *
 * El trazo mide el doble del ancho visible: al desplazarlo la mitad vuelve al
 * punto de partida y el bucle no se nota. La caja recorta ese sobrante, que es
 * lo que evita que aparezca una barra de desplazamiento horizontal.
 */
@Component({
  selector: 'app-onda',
  standalone: true,
  template: `
    <div class="onda" [class.onda-abajo]="abajo()" [class.onda-invertida]="simple() && abajo()"
         aria-hidden="true">
      @if (simple()) {
        <svg [attr.viewBox]="'0 0 2880 ' + alto()" preserveAspectRatio="none" class="capa capa-1">
          <path [attr.d]="trazoSimple()" [attr.fill]="color()" />
        </svg>
      } @else {
        @for (trazo of trazos(); track $index; let i = $index) {
          <svg [attr.viewBox]="'0 0 2880 ' + alto()" preserveAspectRatio="none"
               class="capa" [class]="'capa capa-' + (i + 1)">
            <path [attr.d]="trazo" [attr.fill]="color()" [attr.fill-opacity]="opacidades[i]" />
          </svg>
        }
      }
    </div>
  `,
  styles: [
    `
      :host {
        display: block;
      }

      .onda {
        position: relative;
        width: 100%;
        height: var(--onda-alto, 120px);
        /* Recorta el sobrante del trazo doble: sin esto el sitio gana una
           barra de desplazamiento horizontal que se mueve con la animación. */
        overflow: hidden;
        pointer-events: none;
      }

      /*
        El trazo simple está dibujado con el relleno hacia arriba. Cuando cierra
        una sección por abajo se lo da vuelta desde la caja: el desplazamiento
        de las capas no se toca porque vive en los hijos.
      */
      .onda-invertida {
        transform: scaleY(-1);
      }

      .capa {
        position: absolute;
        inset: 0;
        width: 200%;
        height: 100%;
        display: block;
      }

      /* Cada capa corre a su ritmo: la de adelante más rápido que la de atrás. */
      .capa-1 {
        animation: deslizar 26s linear infinite;
      }

      .capa-2 {
        animation: deslizar 38s linear infinite;
      }

      .capa-3 {
        animation: deslizar 52s linear infinite reverse;
      }

      .onda-abajo .capa-1 {
        animation-duration: 30s;
      }

      .onda-abajo .capa-2 {
        animation-duration: 44s;
        animation-direction: reverse;
      }

      .onda-abajo .capa-3 {
        animation-duration: 60s;
        animation-direction: normal;
      }

      @keyframes deslizar {
        from {
          transform: translateX(0);
        }
        to {
          transform: translateX(-50%);
        }
      }

      @media (prefers-reduced-motion: reduce) {
        .capa {
          animation: none;
          width: 100%;
        }
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Onda {
  /** Una sola ola en lugar de tres capas. */
  readonly simple = input(false);

  /** Las olas cierran hacia abajo en vez de entrar desde arriba. */
  readonly abajo = input(false);

  /** Color de relleno. Las capas lo comparten y se distinguen por opacidad. */
  readonly color = input('#FFFFFF');

  /** Alto del dibujo. La caja lo toma de la variable `--onda-alto`. */
  readonly alto = input(120);

  /** Para la cabecera y el pie el trazo es propio, más bajo. */
  readonly variante = input<'cabecera' | 'pie' | 'seccion'>('seccion');

  /** La de atrás casi transparente, la de adelante llena. */
  readonly opacidades = [1, 0.45, 0.25];

  readonly trazoSimple = computed(() =>
    this.variante() === 'cabecera' ? TRAZOS_ONDA.cabecera : TRAZOS_ONDA.pie,
  );

  readonly trazos = computed(() => (this.abajo() ? TRAZOS_ONDA.abajo : TRAZOS_ONDA.arriba));
}
