import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ESTADO_NOVEDAD, ETIQUETA_ESTADO, PERMISOS, type EstadoNovedad } from '@cirsub/shared';
import { PanelService, type NovedadPanel } from '../../../../core/servicios/panel.service';
import { SesionService } from '../../../../core/servicios/sesion.service';

@Component({
  selector: 'app-lista-novedades',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './lista-novedades.html',
  styleUrls: ['../../componentes/panel.css', './lista-novedades.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ListaNovedades implements OnInit {
  private readonly panel = inject(PanelService);
  private readonly ruta = inject(ActivatedRoute);
  private readonly router = inject(Router);
  readonly sesion = inject(SesionService);

  readonly items = signal<readonly NovedadPanel[]>([]);
  readonly cargando = signal(true);
  readonly pagina = signal(1);
  readonly totalPaginas = signal(1);
  readonly total = signal(0);
  readonly estado = signal<string>('');
  readonly busqueda = signal('');

  readonly etiquetas = ETIQUETA_ESTADO;

  readonly filtrosEstado: readonly { valor: string; etiqueta: string }[] = [
    { valor: '', etiqueta: 'Todas' },
    { valor: ESTADO_NOVEDAD.EN_REVISION, etiqueta: 'En revisión' },
    { valor: ESTADO_NOVEDAD.BORRADOR, etiqueta: 'Borradores' },
    { valor: ESTADO_NOVEDAD.CAMBIOS_PEDIDOS, etiqueta: 'Con cambios pedidos' },
    { valor: ESTADO_NOVEDAD.PUBLICADA, etiqueta: 'Publicadas' },
    { valor: ESTADO_NOVEDAD.ARCHIVADA, etiqueta: 'Archivadas' },
  ];

  ngOnInit(): void {
    this.ruta.queryParamMap.subscribe((p) => {
      this.estado.set(p.get('estado') ?? '');
      this.busqueda.set(p.get('busqueda') ?? '');
      this.pagina.set(Number(p.get('pagina')) || 1);
      this.cargar();
    });
  }

  filtrar(estado: string): void {
    void this.router.navigate([], {
      queryParams: { estado: estado || null, pagina: null },
      queryParamsHandling: 'merge',
    });
  }

  buscar(texto: string): void {
    void this.router.navigate([], {
      queryParams: { busqueda: texto || null, pagina: null },
      queryParamsHandling: 'merge',
    });
  }

  irAPagina(n: number): void {
    void this.router.navigate([], {
      queryParams: { pagina: n > 1 ? n : null },
      queryParamsHandling: 'merge',
    });
  }

  paginas(): number[] {
    return Array.from({ length: this.totalPaginas() }, (_, i) => i + 1);
  }

  puedeCrear(): boolean {
    return this.sesion.puede(PERMISOS.NOVEDADES_CREAR);
  }

  /** Rótulo del estado, para que la fila se lea sin tener que abrir la nota. */
  detalle(n: NovedadPanel): string {
    if (n.estado === ESTADO_NOVEDAD.EN_REVISION) return 'Esperando revisión';
    if (n.estado === ESTADO_NOVEDAD.CAMBIOS_PEDIDOS) return 'Te pidieron cambios';
    if (n.estado === ESTADO_NOVEDAD.PUBLICADA && n.enCarrusel) return 'En el carrusel';
    return '';
  }

  private cargar(): void {
    this.cargando.set(true);
    this.panel
      .novedades({
        estado: this.estado() || undefined,
        busqueda: this.busqueda() || undefined,
        pagina: this.pagina(),
      })
      .subscribe({
        next: (r) => {
          this.items.set(r.items);
          this.total.set(r.total);
          this.totalPaginas.set(r.totalPaginas);
          this.cargando.set(false);
        },
        error: () => this.cargando.set(false),
      });
  }
}
