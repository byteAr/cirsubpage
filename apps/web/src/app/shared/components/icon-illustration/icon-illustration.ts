import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { DomSanitizer, type SafeHtml } from '@angular/platform-browser';
import { inject } from '@angular/core';
import type { IconoServicio } from '../../../core/models';

/**
 * Iconografía de línea del sistema de diseño.
 *
 * Un solo trazo de 1.7 sobre una retícula de 32, sin relleno y sin color
 * propio: heredan el color del contenedor. Reemplazan a las ilustraciones con
 * degradés de colores del sitio anterior, que no pertenecían a ninguna familia
 * y competían entre sí en las grillas.
 */
const TRAZOS: Record<string, string> = {
  // ── Servicios ──
  farmacia:
    '<path d="M11 6h10M13 6v4.5L8.5 20a4.5 4.5 0 0 0 4 6.5h7a4.5 4.5 0 0 0 4-6.5L19 10.5V6"/><path d="M16 16v5M13.5 18.5h5"/>',
  turismo:
    '<circle cx="16" cy="16" r="10.5"/><path d="M5.5 16h21"/><path d="M16 5.5c2.8 3 4.2 6.7 4.2 10.5S18.8 23.5 16 26.5c-2.8-3-4.2-6.7-4.2-10.5S13.2 8.5 16 5.5z"/>',
  alojamiento:
    '<path d="M5 25V10.5L16 5l11 5.5V25"/><path d="M5 25h22"/><path d="M12.5 25v-7h7v7"/><path d="M12.5 13.5h3M17 13.5h2.5"/>',
  juridico:
    '<path d="M16 6v20"/><path d="M9 26h14"/><path d="M6 11h20"/><path d="M6 11l-3 6.5h6z"/><path d="M26 11l-3 6.5h6z"/>',
  sepelio: '<path d="M8 27V12l8-6 8 6v15z"/><path d="M16 11v8M12.5 14.5h7"/>',
  subsidios:
    '<path d="M6 12h20v13H6z"/><path d="M6 12l4-6h12l4 6"/><path d="M16 6v6"/><path d="M12.5 18h7"/>',
  tesoreria:
    '<circle cx="16" cy="16" r="10.5"/><path d="M19 12.5c-.8-1.2-2-1.7-3.4-1.7-1.9 0-3.1 1-3.1 2.4 0 3.4 6.8 1.8 6.8 5.4 0 1.6-1.4 2.6-3.4 2.6-1.6 0-3-.6-3.9-1.9"/><path d="M16 8.5v15"/>',
  salud:
    '<path d="M5.5 16h5l2-4.5 4 10 3-7 2 3.5h5"/><path d="M16 26s-8.5-5-8.5-10.5"/><path d="M16 26s8.5-5 8.5-10.5"/>',

  // Dibujados para esta sección, en el mismo lenguaje que los anteriores.
  anillos:
    '<circle cx="12.5" cy="19" r="6.5"/><circle cx="19.5" cy="19" r="6.5"/><path d="M12.5 12.5 16 6l3.5 6.5"/>',
  bebe:
    '<circle cx="16" cy="15" r="8.5"/><path d="M12.5 13.5v.01M19.5 13.5v.01"/><path d="M13 18.5c.9 1 1.9 1.5 3 1.5s2.1-.5 3-1.5"/><path d="M16 6.5v-2M7.5 15h-2M26.5 15h-2"/>',
  evacuacion:
    '<path d="M16 5.5 6 10v7.5c0 5.5 4.2 9.5 10 11 5.8-1.5 10-5.5 10-11V10z"/><path d="M16 11.5v6M16 21v.01"/>',

  // ── Trámites ──
  afiliacion:
    '<circle cx="13" cy="12" r="4.5"/><path d="M5.5 25c0-4.4 3.4-7.5 7.5-7.5s7.5 3.1 7.5 7.5"/><path d="M23 12v7M19.5 15.5h7"/>',
  credencial:
    '<rect x="4.5" y="8" width="23" height="16" rx="4"/><circle cx="12" cy="15" r="2.8"/><path d="M7.5 21c.6-2 2.4-3 4.5-3s3.9 1 4.5 3"/><path d="M20 13.5h4M20 17.5h4"/>',
  personal:
    '<circle cx="11.5" cy="12" r="4"/><circle cx="21" cy="13.5" r="3.2"/><path d="M4.5 25c0-4 3.1-6.8 7-6.8s7 2.8 7 6.8"/><path d="M19.5 25c0-3.1 1.9-5.3 4.5-5.3 2 0 3.5 1.3 3.5 3.3"/>',

  // ── Institucional y departamentos ──
  presidencia:
    '<path d="M6 25h20"/><path d="M8.5 25V13l7.5-6 7.5 6v12"/><path d="M13 25v-6h6v6"/>',
  secretaria:
    '<path d="M8 5h11l5 5v17H8z"/><path d="M19 5v5h5"/><path d="M12 16h8M12 20h8"/>',
  patrimonio:
    '<path d="M5 26h22"/><path d="M7 26V13M12.5 26V13M19.5 26V13M25 26V13"/><path d="M4 13h24L16 6z"/>',
  bienestar:
    '<path d="M16 26s-9-5.4-9-11.5C7 10.9 9.6 8.5 12.7 8.5c1.8 0 3 .8 3.3 1.6.3-.8 1.5-1.6 3.3-1.6 3.1 0 5.7 2.4 5.7 6 0 6.1-9 11.5-9 11.5z"/>',
  prensa:
    '<path d="M5 8h16v17H7.5A2.5 2.5 0 0 1 5 22.5z"/><path d="M21 12h5v10.5a2.5 2.5 0 0 1-5 0z"/><path d="M8.5 12h9M8.5 16h9M8.5 20h5"/>',
  cultura:
    '<path d="M6 25V9l10-3 10 3v16"/><path d="M6 25h20"/><path d="M11 25V15h4v10M19 15h3v10"/>',
  auditoria:
    '<path d="M8 5h11l5 5v17H8z"/><path d="M19 5v5h5"/><circle cx="15" cy="17" r="3.5"/><path d="M17.6 19.6 21 23"/>',
  legales:
    '<path d="M8 5h11l5 5v17H8z"/><path d="M19 5v5h5"/><path d="M12 15h8M12 19h5"/><path d="M18.5 22.5l2 2 4-4.5"/>',
  archivo:
    '<rect x="4.5" y="7" width="23" height="6" rx="2"/><path d="M6.5 13v11a2 2 0 0 0 2 2h15a2 2 0 0 0 2-2V13"/><path d="M13 18h6"/>',
  urna:
    '<path d="M6 13h20v13H6z"/><path d="M9 13V8h14v5"/><path d="M13 10.5h6"/><path d="M16 17v5"/>',
  recepcion:
    '<path d="M5 22h22"/><path d="M7.5 22v-4.5a8.5 8.5 0 0 1 17 0V22"/><path d="M16 9V6.5"/><circle cx="16" cy="5" r="1.4"/><path d="M9 26h14"/>',
  protocolo:
    '<path d="M16 5.5 19 12l7 1-5 5 1.2 7L16 21.5 9.8 25l1.2-7-5-5 7-1z"/>',
  sistemas:
    '<rect x="4.5" y="6" width="10" height="9" rx="2.5"/><rect x="17.5" y="6" width="10" height="9" rx="2.5"/><rect x="11" y="19" width="10" height="9" rx="2.5"/><path d="M9.5 15v2h13v-2M16 17v2"/>',
  recibo:
    '<path d="M8 4.5h16v23l-2.7-2-2.7 2-2.6-2-2.7 2-2.6-2-2.7 2z"/><path d="M12 11h8M12 15.5h8M12 20h5"/>',
};

/**
 * Cada slug del sitio apunta a uno de los trazos.
 *
 * El diseño entregó su propio catálogo pensado para una lista de servicios que
 * no coincide del todo con la real, así que acá se hace la traducción. Los que
 * no tenían equivalente se dibujaron con el mismo trazo y la misma retícula.
 */
const MAPA: Record<IconoServicio, string> = {
  // Servicios
  'asesoramiento-contable': 'tesoreria',
  'asesoramiento-juridico': 'juridico',
  'bodas-de-oro': 'anillos',
  'subsidio-casamiento': 'bienestar',
  'subsidio-hijos': 'bebe',
  'subsidio-sepelio': 'sepelio',
  turismo: 'turismo',
  farmacia: 'farmacia',
  evacuacion: 'evacuacion',

  // Trámites
  afiliacion: 'afiliacion',
  'actualizacion-datos': 'archivo',
  'alta-familiar': 'personal',

  // Nosotros
  institucional: 'patrimonio',
  autoridades: 'presidencia',

  // Recibos
  retirados: 'recibo',
  actividad: 'credencial',

  // Departamentos de contacto
  hotel: 'alojamiento',
  bienestar: 'bienestar',
  comunicacion: 'prensa',
  electoral: 'urna',
  fiscalizadora: 'auditoria',
  presidencia: 'presidencia',
  presupuesto: 'subsidios',
  protocolo: 'protocolo',
  recepcion: 'recepcion',
  rrhh: 'personal',
  secretaria: 'secretaria',
};

@Component({
  selector: 'app-icon-illustration',
  standalone: true,
  template: `
    <svg
      viewBox="0 0 32 32"
      fill="none"
      stroke="currentColor"
      stroke-width="1.7"
      stroke-linecap="round"
      stroke-linejoin="round"
      aria-hidden="true"
      [innerHTML]="trazo()"
    ></svg>
  `,
  styles: [
    `
      :host {
        display: block;
        color: var(--color-teal);
      }

      svg {
        width: 100%;
        height: 100%;
        display: block;
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class IconIllustration {
  private readonly sanitizador = inject(DomSanitizer);

  readonly name = input.required<IconoServicio>();

  readonly trazo = computed<SafeHtml>(() => {
    // Los trazos son constantes del código, no contenido de terceros.
    const clave = MAPA[this.name()] ?? 'archivo';
    return this.sanitizador.bypassSecurityTrustHtml(TRAZOS[clave] ?? TRAZOS['archivo']!);
  });
}
