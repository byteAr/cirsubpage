import { ChangeDetectionStrategy, Component, input } from '@angular/core';

export type IconoFicha =
  | 'direccion'
  | 'whatsapp'
  | 'telefono'
  | 'email'
  | 'hotel'
  | 'wifi'
  | 'aire'
  | 'servicio-habitacion'
  | 'buffet'
  | 'convenio';

/**
 * Íconos de la ficha de filial, dibujados en línea para que hereden el color del
 * texto y no dependan de una tipografía de íconos.
 *
 * WhatsApp es el único con relleno: es una marca y se reconoce por su forma.
 */
@Component({
  selector: 'app-icono-ficha',
  standalone: true,
  template: `
    @switch (nombre()) {
      @case ('whatsapp') {
        <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
          <path d="M12 2.2a9.7 9.7 0 0 0-8.4 14.6L2.2 21.8l5.1-1.3A9.7 9.7 0 1 0 12 2.2zm0 17.7a8 8 0 0 1-4.1-1.1l-.3-.2-3 .8.8-2.9-.2-.3A8 8 0 1 1 12 19.9zm4.4-6c-.2-.1-1.4-.7-1.7-.8s-.4-.1-.5.1l-.8.9c-.1.2-.3.2-.5.1a6.6 6.6 0 0 1-3.3-2.9c-.2-.4.2-.4.7-1.3.1-.2 0-.3 0-.4l-.8-1.8c-.2-.5-.4-.4-.5-.4h-.5a.9.9 0 0 0-.6.3 2.7 2.7 0 0 0-.9 2 4.7 4.7 0 0 0 1 2.5 10.7 10.7 0 0 0 4.1 3.6c1.5.7 2.1.7 2.9.6a2.4 2.4 0 0 0 1.6-1.1 2 2 0 0 0 .1-1.1c0-.1-.2-.2-.4-.3z"/>
        </svg>
      }
      @default {
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"
             stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          @switch (nombre()) {
            @case ('direccion') {
              <path d="M19 10.2c0 5.2-7 11-7 11s-7-5.8-7-11a7 7 0 1 1 14 0z"/><circle cx="12" cy="10" r="2.6"/>
            }
            @case ('telefono') {
              <path d="M6.5 3h3l1.5 4-2 1.4a12 12 0 0 0 5.6 5.6l1.4-2 4 1.5v3a2 2 0 0 1-2.2 2A16.5 16.5 0 0 1 4.5 5.2 2 2 0 0 1 6.5 3z"/>
            }
            @case ('email') {
              <rect x="2.8" y="5" width="18.4" height="14" rx="2"/><path d="m3.6 6.4 8.4 6.2 8.4-6.2"/>
            }
            @case ('hotel') {
              <path d="M3 19V6"/><path d="M3 15h18v4"/><path d="M21 15v-3a3 3 0 0 0-3-3h-7v6"/><circle cx="7" cy="11.5" r="2"/>
            }
            @case ('wifi') {
              <path d="M2.5 9a14 14 0 0 1 19 0"/><path d="M5.5 12.4a9.5 9.5 0 0 1 13 0"/><path d="M8.6 15.7a5 5 0 0 1 6.8 0"/><circle cx="12" cy="19" r="1" fill="currentColor"/>
            }
            @case ('aire') {
              <path d="M12 3v18"/><path d="m8.5 5 3.5 2.5L15.5 5"/><path d="m8.5 19 3.5-2.5 3.5 2.5"/><path d="M4.2 7.5 19.8 16.5"/><path d="m3.6 11.8 4-.6-1.5-3.8"/><path d="m20.4 12.2-4 .6 1.5 3.8"/><path d="M19.8 7.5 4.2 16.5"/>
            }
            @case ('servicio-habitacion') {
              <path d="M4 17h16"/><path d="M5.5 17a6.5 6.5 0 0 1 13 0"/><path d="M12 8.5V7"/><path d="M10.5 7h3"/><path d="M3 20h18"/>
            }
            @case ('buffet') {
              <path d="M7 3v8"/><path d="M5 3v4a2 2 0 0 0 4 0V3"/><path d="M7 11v10"/><path d="M17 21V3c-2 1.5-3 4-3 7v3h3"/>
            }
            @case ('convenio') {
              <path d="M20.6 13.4 13.4 20.6a2 2 0 0 1-2.8 0L3 13V3h10l7.6 7.6a2 2 0 0 1 0 2.8z"/><circle cx="7.5" cy="7.5" r="1.5"/>
            }
          }
        </svg>
      }
    }
  `,
  styles: `
    :host {
      display: inline-flex;
      flex: none;
    }

    svg {
      width: 100%;
      height: 100%;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class IconoFichaComponent {
  readonly nombre = input.required<IconoFicha>();
}
