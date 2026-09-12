import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnInit, inject, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { firstValueFrom } from 'rxjs';
import { PanelService, type Medio } from '../../../core/servicios/panel.service';

/**
 * Selector de imagen: biblioteca de medios en una ventana modal, con subida
 * directa. Se usa desde el editor de novedad para la diapositiva, la portada y
 * las imágenes del cuerpo.
 */
@Component({
  selector: 'app-selector-medio',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './selector-medio.html',
  styleUrls: ['./panel.css', './selector-medio.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SelectorMedio implements OnInit {
  private readonly panel = inject(PanelService);

  readonly elegido = output<Medio>();
  readonly cerrar = output<void>();

  readonly medios = signal<readonly Medio[]>([]);
  readonly cargando = signal(true);
  readonly subiendo = signal(false);
  readonly busqueda = signal('');
  readonly error = signal<string | null>(null);
  readonly arrastrando = signal(false);

  ngOnInit(): void {
    this.cargar();
  }

  cargar(): void {
    this.cargando.set(true);
    this.panel.medios({ busqueda: this.busqueda() || undefined, soloImagenes: true }).subscribe({
      next: (r) => {
        this.medios.set(r.items);
        this.cargando.set(false);
      },
      error: () => this.cargando.set(false),
    });
  }

  buscar(texto: string): void {
    this.busqueda.set(texto);
    this.cargar();
  }

  alSoltar(evento: DragEvent): void {
    evento.preventDefault();
    this.arrastrando.set(false);
    const archivo = evento.dataTransfer?.files?.[0];
    if (archivo) void this.subir(archivo);
  }

  alElegirArchivo(evento: Event): void {
    const entrada = evento.target as HTMLInputElement;
    const archivo = entrada.files?.[0];
    if (archivo) void this.subir(archivo);
    entrada.value = '';
  }

  async subir(archivo: File): Promise<void> {
    if (this.subiendo()) return;

    this.subiendo.set(true);
    this.error.set(null);

    try {
      const medio = await firstValueFrom(this.panel.subirMedio(archivo));
      // La recién subida va primera: es la que se acaba de elegir.
      this.medios.update((lista) => [medio, ...lista]);
      this.elegido.emit(medio);
    } catch (e) {
      const cuerpo = (e as { error?: { message?: string } }).error;
      this.error.set(cuerpo?.message ?? 'No pudimos subir el archivo.');
    } finally {
      this.subiendo.set(false);
    }
  }

  tamano(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} kB`;
    return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  }
}
