import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { firstValueFrom } from 'rxjs';
import { PERMISOS } from '@cirsub/shared';
import { PanelService, type Medio } from '../../../../core/servicios/panel.service';
import { SesionService } from '../../../../core/servicios/sesion.service';

@Component({
  selector: 'app-medios',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './medios.html',
  styleUrls: ['../../componentes/panel.css', './medios.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Medios implements OnInit {
  private readonly panel = inject(PanelService);
  readonly sesion = inject(SesionService);

  readonly items = signal<Medio[]>([]);
  readonly cargando = signal(true);
  readonly subiendo = signal(false);
  readonly arrastrando = signal(false);
  readonly busqueda = signal('');
  readonly error = signal<string | null>(null);
  readonly detalle = signal<Medio | null>(null);
  readonly altEnEdicion = signal('');
  readonly total = signal(0);

  ngOnInit(): void {
    this.cargar();
  }

  buscar(texto: string): void {
    this.busqueda.set(texto);
    this.cargar();
  }

  alSoltar(evento: DragEvent): void {
    evento.preventDefault();
    this.arrastrando.set(false);
    const archivos = Array.from(evento.dataTransfer?.files ?? []);
    void this.subirVarios(archivos);
  }

  alElegirArchivos(evento: Event): void {
    const entrada = evento.target as HTMLInputElement;
    void this.subirVarios(Array.from(entrada.files ?? []));
    entrada.value = '';
  }

  abrirDetalle(medio: Medio): void {
    this.detalle.set(medio);
    this.altEnEdicion.set(medio.alt ?? '');
  }

  async guardarAlt(): Promise<void> {
    const medio = this.detalle();
    if (!medio) return;

    try {
      const actualizado = await firstValueFrom(
        this.panel.actualizarAlt(medio.id, this.altEnEdicion()),
      );
      this.items.update((lista) => lista.map((m) => (m.id === medio.id ? actualizado : m)));
      this.detalle.set(actualizado);
    } catch {
      this.error.set('No pudimos guardar el texto alternativo.');
    }
  }

  async eliminar(medio: Medio): Promise<void> {
    // La API rechaza el borrado si el archivo está usado en una novedad.
    if (!confirm(`¿Eliminar "${medio.nombre}"? No se puede deshacer.`)) return;

    try {
      await firstValueFrom(this.panel.eliminarMedio(medio.id));
      this.items.update((lista) => lista.filter((m) => m.id !== medio.id));
      this.detalle.set(null);
    } catch (e) {
      const cuerpo = (e as { error?: { message?: string } }).error;
      this.error.set(cuerpo?.message ?? 'No pudimos eliminar el archivo.');
    }
  }

  puedeEliminar(): boolean {
    return this.sesion.puede(PERMISOS.MEDIOS_ELIMINAR);
  }

  tamano(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} kB`;
    return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  }

  private async subirVarios(archivos: File[]): Promise<void> {
    if (archivos.length === 0 || this.subiendo()) return;

    this.subiendo.set(true);
    this.error.set(null);

    for (const archivo of archivos) {
      try {
        const medio = await firstValueFrom(this.panel.subirMedio(archivo));
        this.items.update((lista) => [medio, ...lista]);
        this.total.update((n) => n + 1);
      } catch (e) {
        const cuerpo = (e as { error?: { message?: string } }).error;
        this.error.set(`${archivo.name}: ${cuerpo?.message ?? 'no se pudo subir'}`);
      }
    }

    this.subiendo.set(false);
  }

  private cargar(): void {
    this.cargando.set(true);
    this.panel.medios({ busqueda: this.busqueda() || undefined }).subscribe({
      next: (r) => {
        this.items.set([...r.items]);
        this.total.set(r.total);
        this.cargando.set(false);
      },
      error: () => this.cargando.set(false),
    });
  }
}
