import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ContenidoService } from '../../../core/servicios/contenido.service';

const MESES: Record<string, string> = {
  ene: 'enero', feb: 'febrero', mar: 'marzo', abr: 'abril', may: 'mayo', jun: 'junio',
  jul: 'julio', ago: 'agosto', sep: 'septiembre', set: 'septiembre', oct: 'octubre',
  nov: 'noviembre', dic: 'diciembre',
};

const PESOS = new Intl.NumberFormat('es-AR', {
  style: 'currency',
  currency: 'ARS',
  maximumFractionDigits: 0,
});

/**
 * Cuota y reintegros de sepelio, con los importes que publica Afiliaciones en
 * el sistema de gestión: los mismos que ve el asociado en la app.
 *
 * Si gestión no contesta, no se muestra nada. Una tabla vacía o con un error
 * confunde más que no tenerla, y el resto de la página sigue sirviendo.
 */
@Component({
  selector: 'app-valores-sepelio',
  standalone: true,
  template: `
    @if (valores()?.filas?.length) {
      <section class="valores" aria-labelledby="titulo-valores-sepelio">
        <h2 id="titulo-valores-sepelio">Valores vigentes</h2>
        <table>
          <thead>
            <tr>
              <th scope="col">Concepto</th>
              <th scope="col" class="importe">Importe</th>
            </tr>
          </thead>
          <tbody>
            @for (fila of valores()!.filas; track fila.concepto) {
              <tr>
                <th scope="row">
                  {{ fila.concepto }}
                  @if (mes(fila.desde); as desde) {
                    <small>Desde {{ desde }}</small>
                  }
                </th>
                <td class="importe">{{ pesos(fila.importe) }}</td>
              </tr>
            }
          </tbody>
        </table>
        <p class="nota">Valores establecidos por la prestadora del servicio.</p>
      </section>
    }
  `,
  styleUrl: './valores-sepelio.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TablaValoresSepelio {
  readonly valores = toSignal(inject(ContenidoService).valoresSepelio());

  pesos(importe: number): string {
    return PESOS.format(importe);
  }

  /** "nov 26" → "noviembre 2026". Lo que no se entiende no se muestra, para no inventar fechas. */
  mes(crudo: string | null): string | null {
    const partes = /^([a-z]{3})\.?\s*(\d{2}|\d{4})$/i.exec(crudo?.trim() ?? '');
    const nombre = partes && MESES[partes[1].toLowerCase()];
    if (!partes || !nombre) return null;
    return `${nombre} ${partes[2].length === 2 ? `20${partes[2]}` : partes[2]}`;
  }
}
