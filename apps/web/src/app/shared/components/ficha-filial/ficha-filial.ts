import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  HostListener,
  computed,
  input,
  output,
} from '@angular/core';
import { IconoFichaComponent } from './icono-ficha';
import {
  TIPO_CONTACTO,
  TIPOS_CONTACTO,
  consultaDeDireccion,
  enlaceDeContacto,
  type Filial,
} from '@cirsub/shared';

/**
 * Ficha de filial en una ventana modal.
 *
 * Reemplaza al modal viejo, que se inyectaba a mano en el `body` con estilos
 * forzados. Acá es un componente común: el fondo cierra al tocarlo, la tecla de
 * escape también, y el contenido se desplaza solo si no entra.
 */
@Component({
  selector: 'app-ficha-filial',
  standalone: true,
  imports: [CommonModule, IconoFichaComponent],
  templateUrl: './ficha-filial.html',
  styleUrl: './ficha-filial.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FichaFilial {
  readonly filial = input.required<Filial>();
  readonly cerrar = output<void>();

  @HostListener('document:keydown.escape')
  alEscape(): void {
    this.cerrar.emit();
  }

  /**
   * Abre la dirección en la aplicación de mapas del teléfono, o en el navegador
   * si no tiene una. No hace falta ninguna clave de Google para este enlace.
   */
  enlaceMapa(): string {
    const f = this.filial();
    const consulta = f.direccion ? consultaDeDireccion(f) : `${f.lat},${f.lng}`;
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(consulta)}`;
  }

  readonly contactos = computed(() =>
    this.filial().contactos.map((c) => ({
      tipo: c.tipo,
      nombre: TIPOS_CONTACTO.find((t) => t.id === c.tipo)?.nombre ?? 'Contacto',
      valor: c.valor,
      etiqueta: c.etiqueta,
      enlace: enlaceDeContacto(c),
      externo: c.tipo === TIPO_CONTACTO.WHATSAPP,
    })),
  );

  /** La API los manda con nombre e ícono, en el orden del catálogo. */
  readonly servicios = computed(() => this.filial().serviciosHotel ?? []);

  /** El primer número al que se puede llamar, para el botón grande. */
  readonly telefono = computed(() => {
    const c = this.filial().contactos.find((x) => x.tipo === TIPO_CONTACTO.TELEFONO);
    return c ? enlaceDeContacto(c) : null;
  });
}
