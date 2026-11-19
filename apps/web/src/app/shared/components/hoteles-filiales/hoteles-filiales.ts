import { ChangeDetectionStrategy, Component, ElementRef, computed, inject, signal, viewChild } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { tieneHotel, type Filial } from '@cirsub/shared';
import { ContenidoService } from '../../../core/servicios/contenido.service';
import { FichaFilial } from '../ficha-filial/ficha-filial';

/**
 * Selector de las filiales con hotel, para la página de alojamiento. Al elegir
 * una se abre la misma ficha que en Filiales, con los contactos que la filial
 * carga en el panel: de ahí sale con quién reservar.
 *
 * La lista sale de lo que cada filial marca en el panel, así que crece o se
 * achica sola. Si ninguna marcó hotel, no se muestra nada.
 */
@Component({
  selector: 'app-hoteles-filiales',
  standalone: true,
  imports: [FichaFilial],
  template: `
    @if (conHotel().length) {
      <section class="hoteles" aria-labelledby="titulo-hoteles-filiales">
        <h2 id="titulo-hoteles-filiales">Contacto de las filiales con hospedaje</h2>
        <p>Elegí la filial para ver sus datos de contacto y consultar disponibilidad.</p>

        <label class="campo">
          <span>Filial</span>
          <select #selector (change)="elegir(selector.value)">
            <option value="" selected disabled>Elegí una filial</option>
            @for (f of conHotel(); track f.id) {
              <option [value]="f.id">{{ f.nombre }}</option>
            }
          </select>
        </label>
      </section>
    }

    @if (elegida(); as f) {
      <app-ficha-filial [filial]="f" (cerrar)="cerrar()" />
    }
  `,
  styleUrl: './hoteles-filiales.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HotelesFiliales {
  private readonly filiales = toSignal(inject(ContenidoService).filiales(), { initialValue: [] });
  private readonly selector = viewChild<ElementRef<HTMLSelectElement>>('selector');

  readonly conHotel = computed(() => this.filiales().filter(tieneHotel));
  readonly elegida = signal<Filial | null>(null);

  elegir(id: string): void {
    this.elegida.set(this.conHotel().find((f) => f.id === id) ?? null);
  }

  /** Vuelve al rótulo: si no, elegir otra vez la misma filial no dispara el cambio. */
  cerrar(): void {
    this.elegida.set(null);
    const selector = this.selector()?.nativeElement;
    if (selector) selector.value = '';
  }
}
