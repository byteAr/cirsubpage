import { ChangeDetectionStrategy, Component, input } from '@angular/core';

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

          <h1>{{ titulo() }}</h1>

          @if (bajada()) {
            <p>{{ bajada() }}</p>
          }
        </div>

        <ng-content />
      </div>

      <!-- La onda cierra el encabezado y arranca el fondo blanco del contenido. -->
      <div class="onda" aria-hidden="true">
        <svg viewBox="0 0 2880 120" preserveAspectRatio="none">
          <path d="M0,64 C220,120 420,20 720,44 C980,64 1200,116 1440,72 C1660,28 1860,120 2160,96 C2420,76 2640,4 2880,64 L2880,120 L0,120 Z"
                fill="#FFFFFF" />
        </svg>
      </div>
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
        padding-block: 40px 116px;
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

      .volver {
        display: inline-block;
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
        height: 120px;
        overflow: hidden;
      }

      .onda svg {
        width: 200%;
        height: 100%;
        display: block;
        animation: deslizarOnda 28s linear infinite;
      }

      @keyframes deslizarOnda {
        from {
          transform: translateX(0);
        }
        to {
          transform: translateX(-50%);
        }
      }

      @media (max-width: 900px) {
        .cuerpo {
          padding-block: 28px 78px;
        }

        .onda {
          height: 70px;
        }
      }

      @media (prefers-reduced-motion: reduce) {
        .halo,
        .onda svg {
          animation: none;
        }

        .onda svg {
          width: 100%;
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
