import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  HostListener,
  input,
  output,
} from '@angular/core';
import type { Filial } from '@cirsub/shared';

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

  telefonoLimpio(): string {
    return (this.filial().telefono ?? '').replace(/[^\d+]/g, '');
  }
}
