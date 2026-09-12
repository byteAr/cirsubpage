import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { IconIllustration } from '../icon-illustration/icon-illustration';
import type { IconoServicio } from '../../../core/models';

/**
 * Tarjeta de servicio, trámite o sección. Una sola pieza para los tres índices.
 */
@Component({
  selector: 'app-tarjeta-servicio',
  standalone: true,
  imports: [RouterLink, IconIllustration],
  template: `
    <a [routerLink]="ruta()" class="tarjeta">
      <span class="ilustracion">
        <app-icon-illustration [name]="icono()" />
      </span>
      <span class="cuerpo">
        <span class="titulo">{{ titulo() }}</span>
        @if (descripcion()) {
          <span class="descripcion">{{ descripcion() }}</span>
        }
        <span class="mas">Ver más →</span>
      </span>
    </a>
  `,
  styles: [
    `
      :host {
        display: block;
      }

      .tarjeta {
        display: flex;
        flex-direction: column;
        height: 100%;
        border-radius: var(--radius-2xl);
        overflow: hidden;
        background: #ffffff;
        color: var(--color-tinta);
        box-shadow: var(--shadow-suave);
        transition:
          transform 0.3s var(--ease-rebote),
          box-shadow 0.3s var(--ease-cirsub);
      }

      .tarjeta:hover {
        transform: translateY(-5px);
        box-shadow: var(--shadow-alta);
        color: var(--color-tinta);
      }

      .ilustracion {
        display: grid;
        place-items: center;
        padding: 28px;
        aspect-ratio: 16 / 10;
        background: var(--degrade-suave);
      }

      .ilustracion app-icon-illustration {
        width: 96px;
        height: 96px;
        transition: transform 0.4s var(--ease-rebote);
      }

      .tarjeta:hover .ilustracion app-icon-illustration {
        transform: scale(1.08) rotate(-2deg);
      }

      .cuerpo {
        display: flex;
        flex-direction: column;
        gap: 9px;
        flex: 1;
        padding: 24px 26px 26px;
      }

      .titulo {
        font-family: var(--font-display);
        font-size: 20px;
        font-weight: 600;
        line-height: 1.22;
      }

      .descripcion {
        flex: 1;
        font-size: 16px;
        line-height: 1.55;
        color: var(--color-pizarra);
      }

      .mas {
        font-size: 15px;
        font-weight: 600;
        color: var(--color-azul);
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TarjetaServicio {
  readonly titulo = input.required<string>();
  readonly ruta = input.required<string>();
  readonly icono = input.required<IconoServicio>();
  readonly descripcion = input<string | null>(null);
}
