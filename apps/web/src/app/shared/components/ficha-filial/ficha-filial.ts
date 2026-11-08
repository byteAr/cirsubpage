import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  HostListener,
  computed,
  input,
  output,
} from '@angular/core';
import { TIPO_CONTACTO, TIPOS_CONTACTO, enlaceDeContacto, type Filial } from '@cirsub/shared';

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
  imports: [CommonModule],
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

  /** Enlace a la aplicación de mapas con la dirección de la filial. */
  enlaceMapa(): string {
    const f = this.filial();
    const consulta = f.direccion ? `${f.direccion}, ${f.nombre}` : `${f.lat},${f.lng}`;
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(consulta)}`;
  }

  readonly contactos = computed(() =>
    this.filial().contactos.map((c) => ({
      nombre: TIPOS_CONTACTO.find((t) => t.id === c.tipo)?.nombre ?? 'Contacto',
      valor: c.valor,
      etiqueta: c.etiqueta,
      enlace: enlaceDeContacto(c),
      externo: c.tipo !== TIPO_CONTACTO.TELEFONO && c.tipo !== TIPO_CONTACTO.CELULAR && c.tipo !== TIPO_CONTACTO.EMAIL,
    })),
  );

  /** El primer número al que se puede llamar, para el botón grande. */
  readonly telefono = computed(() => {
    const c = this.filial().contactos.find(
      (x) => x.tipo === TIPO_CONTACTO.TELEFONO || x.tipo === TIPO_CONTACTO.CELULAR,
    );
    return c ? enlaceDeContacto(c) : null;
  });
}
