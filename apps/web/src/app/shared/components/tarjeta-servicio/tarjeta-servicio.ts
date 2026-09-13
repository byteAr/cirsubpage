import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { IconIllustration } from '../icon-illustration/icon-illustration';
import type { IconoServicio } from '../../../core/models';

/**
 * Tarjeta de servicio, trámite o sección.
 *
 * Sigue la card del sistema de diseño: fondo blanco, esquina de 28, el ícono de
 * línea dentro de una baldosa menta de 60 y el texto debajo. Una sola pieza para
 * los tres índices.
 */
@Component({
  selector: 'app-tarjeta-servicio',
  standalone: true,
  imports: [RouterLink, IconIllustration],
  template: `
    <a [routerLink]="ruta()" class="tarjeta">
      <span class="baldosa">
        <app-icon-illustration [name]="icono()" />
      </span>
      <span class="titulo">{{ titulo() }}</span>
      @if (descripcion()) {
        <span class="descripcion">{{ descripcion() }}</span>
      }
      <span class="mas">
        Ver más
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
             stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <path d="M5 12h14M13 6l6 6-6 6" />
        </svg>
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
        padding: 26px 24px 24px;
        border-radius: var(--radius-xl);
        background: #ffffff;
        color: var(--color-tinta);
        box-shadow: 0 8px 26px rgb(22 48 63 / 0.08);
        transition:
          transform 0.3s var(--ease-rebote),
          box-shadow 0.3s var(--ease-cirsub);
      }

      .tarjeta:hover {
        transform: translateY(-5px);
        box-shadow: var(--shadow-alta);
        color: var(--color-tinta);
      }

      .baldosa {
        display: grid;
        place-items: center;
        width: 60px;
        height: 60px;
        margin-bottom: 18px;
        border-radius: 22px;
        background: #e9f8f6;
        color: var(--color-teal);
        transition:
          background 0.3s var(--ease-cirsub),
          color 0.3s var(--ease-cirsub),
          transform 0.4s var(--ease-rebote);
      }

      .baldosa app-icon-illustration {
        width: 30px;
        height: 30px;
      }

      /* Al pasar el puntero la baldosa toma el degradé de marca. */
      .tarjeta:hover .baldosa {
        background: var(--degrade-marca);
        color: #ffffff;
        transform: rotate(-4deg) scale(1.05);
      }

      .titulo {
        font-family: var(--font-display);
        font-size: 20px;
        font-weight: 600;
        line-height: 1.22;
        letter-spacing: -0.02em;
      }

      .descripcion {
        flex: 1;
        margin-top: 8px;
        font-size: 16px;
        line-height: 1.55;
        color: var(--color-pizarra);
      }

      .mas {
        display: inline-flex;
        align-items: center;
        gap: 7px;
        margin-top: 16px;
        font-size: 15px;
        font-weight: 600;
        color: var(--color-azul);
      }

      .mas svg {
        width: 16px;
        height: 16px;
        transition: transform 0.3s var(--ease-rebote);
      }

      .tarjeta:hover .mas svg {
        transform: translateX(4px);
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
