import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { esPaginaFija, type PaginaPanel } from '@cirsub/shared';
import { PanelService } from '../../../../core/servicios/panel.service';
import { IconIllustration } from '../../../../shared/components/icon-illustration/icon-illustration';
import type { IconoServicio } from '../../../../core/models';

/**
 * Los servicios de /beneficios, en el orden en que salen las tarjetas.
 *
 * El orden se guarda aparte, con un botón, igual que en el carrusel: así quien
 * acomoda puede mover varios antes de publicar y no queda el sitio a medias.
 */
@Component({
  selector: 'app-lista-servicios',
  standalone: true,
  imports: [RouterLink, IconIllustration],
  templateUrl: './lista-servicios.html',
  styleUrls: ['../../componentes/panel.css', './lista-servicios.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ListaServicios implements OnInit {
  private readonly panel = inject(PanelService);

  readonly cargando = signal(true);
  readonly guardando = signal(false);
  readonly error = signal<string | null>(null);
  readonly mensaje = signal<string | null>(null);

  readonly servicios = signal<readonly PaginaPanel[]>([]);
  readonly otras = signal<readonly PaginaPanel[]>([]);
  /** El orden tal como vino, para saber si hay algo que guardar. */
  private readonly ordenGuardado = signal<readonly string[]>([]);

  readonly ordenCambiado = computed(
    () => this.servicios().map((s) => s.id).join() !== this.ordenGuardado().join(),
  );

  ngOnInit(): void {
    this.panel.paginasServicio().subscribe({
      next: (l) => this.aplicar(l),
      error: () => {
        this.error.set('No pudimos cargar los servicios.');
        this.cargando.set(false);
      },
    });
  }

  icono(p: PaginaPanel): IconoServicio {
    return (p.icono ?? 'institucional') as IconoServicio;
  }

  subir(i: number): void {
    this.mover(i, i - 1);
  }

  bajar(i: number): void {
    this.mover(i, i + 1);
  }

  async guardarOrden(): Promise<void> {
    if (this.guardando()) return;
    this.guardando.set(true);
    this.error.set(null);
    this.mensaje.set(null);
    try {
      const l = await firstValueFrom(
        this.panel.ordenarPaginasServicio(this.servicios().map((s) => s.id)),
      );
      this.aplicar(l);
      this.mensaje.set('Listo: las tarjetas ya salen en este orden en el sitio.');
    } catch {
      this.error.set('No pudimos guardar el orden. Probá de nuevo.');
    } finally {
      this.guardando.set(false);
    }
  }

  private mover(desde: number, hasta: number): void {
    this.mensaje.set(null);
    this.servicios.update((l) => {
      if (hasta < 0 || hasta >= l.length) return l;
      const copia = [...l];
      const [item] = copia.splice(desde, 1);
      copia.splice(hasta, 0, item);
      return copia;
    });
  }

  private aplicar(lista: readonly PaginaPanel[]): void {
    const servicios = lista.filter((p) => !esPaginaFija(p.slug));
    this.servicios.set(servicios);
    this.otras.set(lista.filter((p) => esPaginaFija(p.slug)));
    this.ordenGuardado.set(servicios.map((s) => s.id));
    this.cargando.set(false);
  }
}
