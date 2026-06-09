import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { IconIllustration } from '../icon-illustration/icon-illustration';
import { IconoServicio } from '../../../core/models';

/**
 * Card reutilizable para mostrar un servicio, trámite o sección.
 * Acepta un `icono` (SVG con gradiente animado) o, como fallback, una `imagen`.
 */
@Component({
  selector: 'app-service-card',
  standalone: true,
  imports: [RouterLink, IconIllustration],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <a
      [routerLink]="ruta()"
      class="group block rounded-2xl overflow-hidden bg-white shadow-md hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 border border-gray-100 cursor-pointer relative"
      [attr.aria-label]="titulo()">

      <!-- Indicador 'click here' flotante -->
      <span class="absolute top-3 right-3 z-10 inline-flex items-center justify-center w-8 h-8 rounded-full bg-white/80 backdrop-blur shadow opacity-0 group-hover:opacity-100 transition-all duration-300 transform group-hover:translate-x-0 translate-x-2">
        <svg class="w-4 h-4 text-gray-700" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <path d="M5 12h14M13 5l7 7-7 7" />
        </svg>
      </span>

      <div class="aspect-[4/3] overflow-hidden bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
        @if (icono(); as ic) {
          <app-icon-illustration [name]="ic" />
        } @else if (imagen(); as img) {
          <img
            [src]="img"
            [alt]="titulo()"
            loading="lazy"
            class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
        }
      </div>

      <div class="p-5 text-center">
        <h3 class="text-lg font-semibold text-gray-800 group-hover:text-green-700 transition-colors">
          {{ titulo() }}
        </h3>
        @if (descripcion()) {
          <p class="text-sm text-gray-500 mt-2 line-clamp-2">{{ descripcion() }}</p>
        }
        <span class="block text-xs text-green-600 font-medium mt-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          Ver más →
        </span>
      </div>
    </a>
  `,
})
export class ServiceCard {
  readonly titulo = input.required<string>();
  readonly ruta = input.required<string>();
  readonly icono = input<IconoServicio | undefined>(undefined);
  readonly imagen = input<string | undefined>(undefined);
  readonly descripcion = input<string | undefined>(undefined);
}
