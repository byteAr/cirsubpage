import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { LIMITES_CARRUSEL } from '@cirsub/shared';
import { PanelService, type NovedadPanel } from '../../../../core/servicios/panel.service';

/**
 * Orden de las diapositivas de la portada.
 *
 * El reordenamiento va por botones además de por arrastre: en un teléfono
 * arrastrar es incómodo y varios referentes trabajan desde el celular.
 */
@Component({
  selector: 'app-carrusel',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './carrusel.html',
  styleUrls: ['../../componentes/panel.css', './carrusel.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Carrusel implements OnInit {
  private readonly panel = inject(PanelService);

  readonly items = signal<NovedadPanel[]>([]);
  readonly cargando = signal(true);
  readonly guardando = signal(false);
  readonly mensaje = signal<string | null>(null);

  readonly limites = LIMITES_CARRUSEL;

  ngOnInit(): void {
    this.cargar();
  }

  subir(indice: number): void {
    if (indice === 0) return;
    this.mover(indice, indice - 1);
  }

  bajar(indice: number): void {
    if (indice >= this.items().length - 1) return;
    this.mover(indice, indice + 1);
  }

  async guardarOrden(): Promise<void> {
    this.guardando.set(true);
    this.mensaje.set(null);

    try {
      await firstValueFrom(
        this.panel.reordenarCarrusel(this.items().map((n, i) => ({ id: n.id, orden: i }))),
      );
      this.mensaje.set('Orden guardado. Ya se ve así en la portada.');
    } catch {
      this.mensaje.set('No pudimos guardar el orden. Probá de nuevo.');
    } finally {
      this.guardando.set(false);
    }
  }

  private mover(desde: number, hasta: number): void {
    const lista = [...this.items()];
    const [elemento] = lista.splice(desde, 1);
    if (elemento) lista.splice(hasta, 0, elemento);
    this.items.set(lista);
  }

  private cargar(): void {
    this.cargando.set(true);
    this.panel.carrusel().subscribe({
      next: (r) => {
        this.items.set([...r]);
        this.cargando.set(false);
      },
      error: () => this.cargando.set(false),
    });
  }
}
