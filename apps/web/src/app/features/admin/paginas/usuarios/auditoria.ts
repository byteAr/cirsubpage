import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { PanelService } from '../../../../core/servicios/panel.service';

interface Entrada {
  id: string;
  accion: string;
  entidad: string;
  resumen: string;
  nivel: string;
  ip: string | null;
  createdAt: string;
  usuario: { id: string; nombre: string; email: string } | null;
}

@Component({
  selector: 'app-auditoria',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="encabezado">
      <div>
        <h1>Auditoría</h1>
        <p>Quién hizo qué y cuándo. Se guarda todo, incluidos los intentos fallidos de ingreso.</p>
      </div>
    </div>

    <div class="filtros">
      @for (f of filtros; track f.valor) {
        <button type="button" [class.chip-activo]="nivel() === f.valor" (click)="filtrar(f.valor)">
          {{ f.etiqueta }}
        </button>
      }
    </div>

    @if (cargando()) {
      <div class="carga">
        @for (i of [1, 2, 3, 4, 5, 6]; track i) {
          <div class="esqueleto"></div>
        }
      </div>
    } @else if (items().length === 0) {
      <div class="tabla-caja">
        <div class="vacio">
          <h2>No hay registros con ese filtro</h2>
          <p>Probá con otro nivel.</p>
        </div>
      </div>
    } @else {
      <ul class="registro">
        @for (e of items(); track e.id) {
          <li [class]="'nivel-' + e.nivel">
            <span class="punto" aria-hidden="true"></span>
            <div class="detalle">
              <span class="resumen">{{ e.resumen }}</span>
              <span class="meta">
                {{ e.usuario?.nombre ?? 'Sistema' }}
                · {{ e.createdAt | date: 'd MMM y, HH:mm' }}
                @if (e.ip) {
                  <span> · IP {{ e.ip }}</span>
                }
              </span>
            </div>
            <span class="accion">{{ e.accion }}</span>
          </li>
        }
      </ul>

      @if (totalPaginas() > 1) {
        <nav class="paginacion" aria-label="Paginación">
          @for (p of paginas(); track p) {
            <button type="button" [class.pagina-activa]="p === pagina()" (click)="irAPagina(p)">
              {{ p }}
            </button>
          }
        </nav>
      }
    }
  `,
  styleUrls: ['../../componentes/panel.css', './auditoria.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Auditoria implements OnInit {
  private readonly panel = inject(PanelService);

  readonly items = signal<readonly Entrada[]>([]);
  readonly cargando = signal(true);
  readonly pagina = signal(1);
  readonly totalPaginas = signal(1);
  readonly nivel = signal('');

  readonly filtros: readonly { valor: string; etiqueta: string }[] = [
    { valor: '', etiqueta: 'Todo' },
    { valor: 'info', etiqueta: 'Informativo' },
    { valor: 'warn', etiqueta: 'Atención' },
    { valor: 'error', etiqueta: 'Errores' },
  ];

  ngOnInit(): void {
    this.cargar();
  }

  filtrar(nivel: string): void {
    this.nivel.set(nivel);
    this.pagina.set(1);
    this.cargar();
  }

  irAPagina(n: number): void {
    this.pagina.set(n);
    this.cargar();
  }

  paginas(): number[] {
    return Array.from({ length: this.totalPaginas() }, (_, i) => i + 1);
  }

  private cargar(): void {
    this.cargando.set(true);
    this.panel.auditoria({ pagina: this.pagina(), nivel: this.nivel() || undefined }).subscribe({
      next: (r) => {
        this.items.set(r.items);
        this.totalPaginas.set(r.totalPaginas);
        this.cargando.set(false);
      },
      error: () => this.cargando.set(false),
    });
  }
}
