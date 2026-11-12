import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import type { IconoServicio } from '@cirsub/shared';

export type IconoFicha =
  | 'direccion'
  | 'whatsapp'
  | 'telefono'
  | 'email'
  | 'hotel'
  | 'convenio'
  | IconoServicio;

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
            @case ('calefaccion') {
              <path d="M12 21c-3.9 0-6.5-2.6-6.5-6.2 0-3.4 2.6-5.2 3.6-8.3.7 1.7 1.8 2.6 2.9 3.1.2-2.2 1.1-4.5 2.9-6.1.4 3.4 3.6 5.6 3.6 10.6 0 4-2.6 6.9-6.5 6.9z"/><path d="M12 21c-1.6 0-2.8-1.2-2.8-2.9 0-1.9 1.6-2.6 2.2-4.3 1.2 1.1 3.4 2.3 3.4 4.3 0 1.7-1.2 2.9-2.8 2.9z"/>
            }
            @case ('desayuno') {
              <path d="M4 9h12v5a5 5 0 0 1-5 5H9a5 5 0 0 1-5-5z"/><path d="M16 10h1.5a2.5 2.5 0 0 1 0 5H16"/><path d="M8 3.5c0 1 1 1.5 1 2.5"/><path d="M12 3.5c0 1 1 1.5 1 2.5"/><path d="M3 21h14"/>
            }
            @case ('cocina') {
              <path d="M5 10h14v6a4 4 0 0 1-4 4H9a4 4 0 0 1-4-4z"/><path d="M3 10h18"/><path d="M10 7h4"/><path d="M12 7V5"/>
            }
            @case ('frigobar') {
              <rect x="6" y="2.5" width="12" height="19" rx="2"/><path d="M6 10h12"/><path d="M9 6v2"/><path d="M9 13v3"/>
            }
            @case ('tv') {
              <rect x="2.5" y="5" width="19" height="12.5" rx="2"/><path d="M8 21h8"/><path d="M12 17.5V21"/>
            }
            @case ('estacionamiento') {
              <rect x="3.5" y="3.5" width="17" height="17" rx="3"/><path d="M9.5 17V7.5h3.3a2.8 2.8 0 0 1 0 5.6H9.5"/>
            }
            @case ('piscina') {
              <path d="M2 18c1.7 0 1.7-1.3 3.3-1.3S7 18 8.7 18s1.7-1.3 3.3-1.3 1.7 1.3 3.3 1.3 1.7-1.3 3.4-1.3S20.3 18 22 18"/><path d="M8 14V5a2 2 0 0 1 4 0"/><path d="M15 14V5a2 2 0 0 1 4 0"/><path d="M8 8h7"/><path d="M8 11.5h7"/>
            }
            @case ('gimnasio') {
              <path d="M6.5 6.5v11"/><path d="M17.5 6.5v11"/><path d="M6.5 12h11"/><path d="M3.5 9v6"/><path d="M20.5 9v6"/>
            }
            @case ('lavanderia') {
              <rect x="4" y="2.5" width="16" height="19" rx="2"/><circle cx="12" cy="13.5" r="4.5"/><path d="M7.5 6h.01"/><path d="M10.5 6h3"/>
            }
            @case ('ascensor') {
              <rect x="4" y="2.5" width="16" height="19" rx="2"/><path d="m9 9.5 3-3 3 3"/><path d="m9 14.5 3 3 3-3"/>
            }
            @case ('accesible') {
              <circle cx="12" cy="4.5" r="1.8"/><path d="M12 7.5v6h5l2 5"/><path d="M12 10.5h4"/><path d="M8.5 11.2a5 5 0 1 0 6.3 6.3"/>
            }
            @case ('mascotas') {
              <circle cx="7" cy="9.5" r="1.8"/><circle cx="17" cy="9.5" r="1.8"/><circle cx="10" cy="5.5" r="1.8"/><circle cx="14" cy="5.5" r="1.8"/><path d="M12 12.5c-2.8 0-5 3.4-5 5.6 0 1.6 1.3 2.4 2.7 2.4 1 0 1.6-.6 2.3-.6s1.3.6 2.3.6c1.4 0 2.7-.8 2.7-2.4 0-2.2-2.2-5.6-5-5.6z"/>
            }
            @case ('cama') {
              <path d="M3 19V8"/><path d="M3 15h18v4"/><path d="M21 15v-2.5A2.5 2.5 0 0 0 18.5 10H11v5"/><circle cx="7" cy="12" r="1.8"/>
            }
            @case ('bano') {
              <path d="M3 12h18v2a5 5 0 0 1-5 5H8a5 5 0 0 1-5-5z"/><path d="M6 12V5.5A2 2 0 0 1 9.5 4"/><path d="M7 19l-1 2"/><path d="M17 19l1 2"/>
            }
            @case ('caja-fuerte') {
              <rect x="3.5" y="4" width="17" height="15" rx="2"/><circle cx="12" cy="11.5" r="3"/><path d="M12 8.5v1"/><path d="M12 13.5v1"/><path d="M6.5 19v1.5"/><path d="M17.5 19v1.5"/>
            }
            @case ('parrilla') {
              <path d="M4 10h16a8 8 0 0 1-16 0z"/><path d="M8 17.5 6.5 21"/><path d="m16 17.5 1.5 3.5"/><path d="M9 3c-.8 1 .8 2 0 3"/><path d="M12 3c-.8 1 .8 2 0 3"/><path d="M15 3c-.8 1 .8 2 0 3"/>
            }
            @case ('jardin') {
              <path d="M12 21v-6"/><path d="M12 15a5 5 0 0 0 4.6-7A5 5 0 0 0 7.4 8 5 5 0 0 0 12 15z"/><path d="m12 15-2.5-2.5"/><path d="m12 13 2.5-2.5"/>
            }
            @case ('seguridad') {
              <path d="M12 2.8 4.5 5.6v5.6c0 4.6 3.2 8.6 7.5 10 4.3-1.4 7.5-5.4 7.5-10V5.6z"/><path d="m8.8 12 2.2 2.2 4.2-4.4"/>
            }
            @case ('ventilador') {
              <circle cx="12" cy="10" r="1.6"/><path d="M12 8.4c0-3 1.2-5.4 3.2-5.4 1.7 0 2.4 1.7 1.3 3.2-1 1.4-2.8 2.2-4.5 2.2"/><path d="M13.4 10.8c2.6 1.5 4.1 3.7 3.1 5.4-.9 1.5-2.7 1.3-3.5-.4-.8-1.6-.6-3.5.4-5"/><path d="M10.6 10.8c-2.6 1.5-5.3 1.6-6.3-.1-.9-1.5.2-3 2.1-2.8 1.7.1 3.3 1.2 4.2 2.9"/><path d="M12 12v6"/><path d="M8.5 21h7"/>
            }
            @case ('microondas') {
              <rect x="2.5" y="5" width="19" height="14" rx="2"/><rect x="5" y="8" width="10" height="8" rx="1"/><path d="M18 8.5h.01"/><path d="M18 12h.01"/><path d="M18 15.5h.01"/>
            }
            @case ('cafetera') {
              <rect x="5" y="3" width="14" height="5" rx="1.5"/><path d="M7 8v13"/><path d="M5 21h14"/><path d="M10 12h7v3a3.5 3.5 0 0 1-7 0z"/><path d="M13.5 9.5v1"/>
            }
            @case ('bar') {
              <path d="M7 3h10l-.5 5a4.5 4.5 0 0 1-9 0z"/><path d="M12 12.5V20"/><path d="M8 21h8"/><path d="M7.4 6.5h9.2"/>
            }
            @case ('agua-caliente') {
              <path d="M12 3.2s-5.5 6-5.5 10.3a5.5 5.5 0 0 0 11 0C17.5 9.2 12 3.2 12 3.2z"/><path d="M9.8 14.5c.7.6 1.4.6 2.2 0s1.5-.6 2.2 0"/>
            }
            @case ('secador') {
              <path d="M3 9.5A5.5 5.5 0 0 1 8.5 4H19v7H8.5A5.5 5.5 0 0 1 3 9.5z"/><path d="M8.5 11v8.5a1.5 1.5 0 0 0 3 0V11"/><circle cx="8.5" cy="7.5" r="1.4"/><path d="M21.5 5.5v4"/>
            }
            @case ('plancha') {
              <path d="M3 17h17a1 1 0 0 0 1-1v-1a6 6 0 0 0-6-6H8"/><path d="M8 9V6.5A1.5 1.5 0 0 1 9.5 5H16"/><path d="M3 17a8 8 0 0 1 6-8"/><path d="M7 20h.01"/><path d="M11 20h.01"/><path d="M15 20h.01"/>
            }
            @case ('toallas') {
              <rect x="4" y="3" width="11" height="18" rx="2"/><path d="M15 6h3a2 2 0 0 1 2 2v13H9"/><path d="M4 16h11"/>
            }
            @case ('cuna') {
              <path d="M4 5v15"/><path d="M20 5v15"/><path d="M4 9h16"/><path d="M4 17h16"/><path d="M8 9v8"/><path d="M12 9v8"/><path d="M16 9v8"/>
            }
            @case ('juegos') {
              <path d="M3 21 7 4h10l4 17"/><path d="M5.5 10.5h13"/><path d="M10 10.5V16"/><path d="M14 10.5V16"/><path d="M9 16h6"/>
            }
            @case ('recepcion-24h') {
              <circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>
            }
            @case ('no-fumar') {
              <path d="M3 15h13v3H3z"/><path d="M19 15v3"/><path d="M21.5 15v3"/><path d="M18 6c0 1.5 1.5 2 1.5 3.5S18 11 18 12"/><path d="M3 3l18 18"/>
            }
            @case ('escritorio') {
              <rect x="4.5" y="5" width="15" height="10" rx="1.5"/><path d="M2.5 19h19"/><path d="M4.5 15 3 19"/><path d="m19.5 15 1.5 4"/>
            }
            @case ('bicicleta') {
              <circle cx="6" cy="16" r="3.5"/><circle cx="18" cy="16" r="3.5"/><path d="M6 16 9.5 8h5l3.5 8"/><path d="m12 16-2.5-8"/><path d="M8.5 6h3"/>
            }
            @case ('traslado') {
              <rect x="4" y="3" width="16" height="15" rx="2.5"/><path d="M4 11h16"/><path d="M7.5 14.5h.01"/><path d="M16.5 14.5h.01"/><path d="M7 18v2.5"/><path d="M17 18v2.5"/>
            }
            @case ('playa') {
              <path d="M12 3a9 9 0 0 1 9 9H3a9 9 0 0 1 9-9z"/><path d="M12 12v7a2 2 0 0 0 4 0"/>
            }
            @case ('vista') {
              <path d="m3 19 6-9 4 5 2.5-3 5.5 7z"/><circle cx="17" cy="6.5" r="2"/>
            }
            @case ('spa') {
              <path d="M12 20c-4.4 0-8-2.4-9-6 2.8-.4 6.4.4 9 3 2.6-2.6 6.2-3.4 9-3-1 3.6-4.6 6-9 6z"/><path d="M12 17c-1.8-2-2.5-4.6-2-7.5C10.5 6.8 12 5 12 5s1.5 1.8 2 4.5c.5 2.9-.2 5.5-2 7.5z"/>
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
