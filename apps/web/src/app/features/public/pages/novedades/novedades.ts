import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import type { NovedadResumen } from '@cirsub/shared';
import { ContenidoService } from '../../../../core/servicios/contenido.service';
import { RevelarDirectiva } from '../../../../shared/directivas/revelar.directiva';

@Component({
  selector: 'app-novedades',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, RevelarDirectiva],
  templateUrl: './novedades.html',
  styleUrl: './novedades.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Novedades implements OnInit {
  private readonly contenido = inject(ContenidoService);
  private readonly ruta = inject(ActivatedRoute);
  private readonly router = inject(Router);

  readonly items = signal<readonly NovedadResumen[]>([]);
  readonly categorias = signal<readonly { slug: string; nombre: string }[]>([]);
  readonly cargando = signal(true);
  readonly pagina = signal(1);
  readonly totalPaginas = signal(1);
  readonly categoria = signal<string>('');
  readonly busqueda = signal('');

  /** La primera novedad se muestra destacada, a doble ancho. */
  readonly destacada = signal<NovedadResumen | null>(null);

  ngOnInit(): void {
    this.contenido.categorias().subscribe((c) => this.categorias.set(c));

    this.ruta.queryParamMap.subscribe((params) => {
      this.pagina.set(Number(params.get('pagina')) || 1);
      this.categoria.set(params.get('categoria') ?? '');
      this.busqueda.set(params.get('busqueda') ?? '');
      this.cargar();
    });
  }

  filtrarPor(categoria: string): void {
    void this.router.navigate([], {
      queryParams: { categoria: categoria || null, pagina: null },
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

  private cargar(): void {
    this.cargando.set(true);
    this.contenido
      .novedades({
        pagina: this.pagina(),
        categoria: this.categoria() || undefined,
        busqueda: this.busqueda() || undefined,
      })
      .subscribe((resultado) => {
        const items = [...resultado.items];
        // Solo en la primera página y sin filtros tiene sentido destacar una.
        const hayFiltro = this.categoria() !== '' || this.busqueda() !== '';
        if (this.pagina() === 1 && !hayFiltro && items.length > 0) {
          this.destacada.set(items.shift() ?? null);
        } else {
          this.destacada.set(null);
        }
        this.items.set(items);
        this.totalPaginas.set(resultado.totalPaginas);
        this.cargando.set(false);
      });
  }
}
