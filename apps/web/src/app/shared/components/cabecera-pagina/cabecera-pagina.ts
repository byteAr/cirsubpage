import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { Onda } from '../onda/onda';

/**
 * Encabezado de las páginas internas.
 *
 * Es el patrón del sistema de diseño: fondo en degradé suave, un halo que
 * flota muy lento, la píldora con el punto de marca y el cierre con una onda
 * en lugar de un borde recto. Al estar en un solo lugar, todas las secciones
 * abren igual.
 */
@Component({
  selector: 'app-cabecera-pagina',
  standalone: true,
  imports: [Onda],
  template: `
    <header class="cabecera">
      <span class="halo halo-a" aria-hidden="true"></span>
      <span class="halo halo-b" aria-hidden="true"></span>

      <div class="contenedor cuerpo">
        <div class="texto">
          @if (volver()) {
            <a [href]="volver()" class="volver">← {{ volverEtiqueta() }}</a>
          }

          <span class="pildora">
            <span class="punto" aria-hidden="true"></span>
            {{ etiqueta() }}
          </span>

          <h1 class="titulo-degradado">{{ titulo() }}</h1>

          @if (bajada()) {
            <p>{{ bajada() }}</p>
          }
        </div>

        <ng-content />
      </div>

      <!-- Tres olas cierran el encabezado y arrancan el fondo blanco del contenido. -->
      <app-onda class="onda" [abajo]="true" [alto]="120" color="#FFFFFF" />
    </header>
  `,
  styles: [
    `
      :host {
        display: block;
      }

      .cabecera {
        position: relative;
        background: var(--degrade-suave);
        overflow: hidden;
      }

      .halo {
        position: absolute;
        border-radius: 50%;
        pointer-events: none;
        animation: flotarHalo 9s ease-in-out infinite;
      }

      .halo-a {
        width: 440px;
        height: 440px;
        top: -150px;
        right: -60px;
        background: radial-gradient(circle at 35% 35%, rgb(0 176 199 / 0.24), transparent 70%);
      }

      .halo-b {
        width: 360px;
        height: 360px;
        bottom: -160px;
        left: -110px;
        background: radial-gradient(circle at 60% 40%, rgb(0 178 74 / 0.18), transparent 70%);
        animation-duration: 12s;
      }

      @keyframes flotarHalo {
        0%,
        100% {
          transform: translateY(0);
        }
        50% {
          transform: translateY(-16px);
        }
      }

      .cuerpo {
        position: relative;
        display: grid;
        grid-template-columns: minmax(0, 1fr);
        gap: 40px;
        align-items: center;
        /*
          El aire de arriba tiene que dejar pasar el logo, que baja por encima
          del borde de la cabecera y cae justo sobre la píldora.
        */
        padding-block: 60px 116px;
      }

      /* Cuando la página proyecta algo al costado, el encabezado se parte en dos. */
      .cuerpo:has(> :not(.texto)) {
        grid-template-columns: minmax(0, 1.4fr) minmax(0, 1fr);
      }

      @media (max-width: 860px) {
        .cuerpo:has(> :not(.texto)) {
          grid-template-columns: minmax(0, 1fr);
        }
      }

      /*
        Bloque y no inline-block: si no, comparte renglón con la píldora que
        viene abajo y las dos se tocan. El ancho ajustado al contenido deja el
        área de clic en el texto y no en toda la columna.
      */
      .volver {
        display: block;
        width: fit-content;
        margin-bottom: 18px;
        font-size: 15px;
        font-weight: 600;
        color: var(--color-teal);
      }

      .pildora {
        display: inline-flex;
        align-items: center;
        gap: 10px;
        padding: 9px 18px 9px 12px;
        margin-bottom: 22px;
        border-radius: 999px;
        background: #ffffff;
        box-shadow: 0 4px 16px rgb(22 48 63 / 0.07);
        font-size: 13.5px;
        font-weight: 600;
        color: var(--color-teal);
      }

      .punto {
        width: 9px;
        height: 9px;
        border-radius: 50%;
        background: var(--degrade-marca);
      }

      h1 {
        font-size: clamp(34px, 4.6vw, 58px);
        line-height: 1.05;
        letter-spacing: -0.032em;
        max-width: 18ch;
      }

      p {
        margin: 16px 0 0;
        max-width: 62ch;
        font-size: 19.5px;
        line-height: 1.6;
        color: var(--color-pizarra);
      }

      .onda {
        position: absolute;
        left: 0;
        bottom: -1px;
        width: 100%;
        --onda-alto: 120px;
      }

      @media (max-width: 900px) {
        .cuerpo {
          padding-block: 40px 78px;
        }

        .onda {
          --onda-alto: 70px;
        }
      }

      @media (prefers-reduced-motion: reduce) {
        .halo {
          animation: none;
        }
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CabeceraPagina {
  readonly etiqueta = input.required<string>();
  readonly titulo = input.required<string>();
  readonly bajada = input<string | null>(null);
  readonly volver = input<string | null>(null);
  readonly volverEtiqueta = input('Volver');
}
