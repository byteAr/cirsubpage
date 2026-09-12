import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import type { Filial } from '@cirsub/shared';
import { ContenidoService } from '../../../../core/servicios/contenido.service';
import { MapaArgentina } from '../../../../shared/components/mapa-argentina/mapa-argentina';
import { FichaFilial } from '../../../../shared/components/ficha-filial/ficha-filial';

@Component({
  selector: 'app-filiales',
  standalone: true,
  imports: [CommonModule, FormsModule, MapaArgentina, FichaFilial],
  templateUrl: './filiales.html',
  styleUrl: './filiales.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Filiales implements OnInit {
  private readonly contenido = inject(ContenidoService);

  readonly filiales = signal<readonly Filial[]>([]);
  readonly busqueda = signal('');
  readonly elegida = signal<Filial | null>(null);

  readonly filtradas = computed(() => {
    const texto = this.busqueda().trim().toLowerCase();
    if (!texto) return this.filiales();
    return this.filiales().filter(
      (f) =>
        f.nombre.toLowerCase().includes(texto) ||
        (f.direccion ?? '').toLowerCase().includes(texto),
    );
  });

  ngOnInit(): void {
    this.contenido.filiales().subscribe((f) => this.filiales.set(f));
  }

  abrir(filial: Filial): void {
    this.elegida.set(filial);
  }

  cerrar(): void {
    this.elegida.set(null);
  }
}
