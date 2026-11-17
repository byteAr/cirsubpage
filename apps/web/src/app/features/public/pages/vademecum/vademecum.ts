import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  afterNextRender,
  computed,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { CabeceraPagina } from '../../../../shared/components/cabecera-pagina/cabecera-pagina';
import { Medicamento, VademecumService } from '../../../../core/servicios/vademecum.service';

/** Un medicamento con su posición en la lista y el texto ya preparado para buscar. */
interface Fila {
  /** Posición en la lista completa: el troquel no alcanza, hay repetidos. */
  readonly id: number;
  readonly m: Medicamento;
  readonly clave: string;
}

/**
 * Cuántas filas se dibujan por página. Con 6.000 medicamentos dibujarlos todos
 * deja la página pesada en un teléfono de gama baja; 40 entran en dos o tres
 * pantallas y la búsqueda es lo que de verdad lleva al medicamento.
 */
const POR_PAGINA = 40;

/** Minúsculas y sin acentos: "Ácido" encuentra "acido" y al revés. */
function normalizar(texto: string): string {
  return texto
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase();
}

@Component({
  selector: 'app-vademecum',
  standalone: true,
  imports: [CabeceraPagina],
  templateUrl: './vademecum.html',
  styleUrl: './vademecum.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Vademecum {
  private readonly servicio = inject(VademecumService);
  private readonly resultados = viewChild<ElementRef<HTMLElement>>('resultados');

  readonly cargando = signal(true);
  readonly error = signal(false);
  private readonly filas = signal<readonly Fila[]>([]);

  readonly consulta = signal('');
  readonly pagina = signal(1);
  /** Filas desplegadas en el teléfono. Pueden quedar varias abiertas a la vez. */
  readonly abiertas = signal<ReadonlySet<number>>(new Set());

  readonly total = computed(() => this.filas().length);

  readonly filtradas = computed(() => {
    const q = normalizar(this.consulta().trim());
    const filas = this.filas();
    return q ? filas.filter((f) => f.clave.includes(q)) : filas;
  });

  readonly totalPaginas = computed(() => Math.max(1, Math.ceil(this.filtradas().length / POR_PAGINA)));

  readonly visibles = computed(() => {
    const desde = (this.pagina() - 1) * POR_PAGINA;
    return this.filtradas().slice(desde, desde + POR_PAGINA);
  });

  constructor() {
    /*
      La lista se pide recién en el navegador. En el servidor no aporta: son
      730 kB que inflarían el HTML y el caché de transferencia, y el buscador
      igual necesita JavaScript para andar.
    */
    afterNextRender(() => {
      this.servicio.medicamentos().subscribe({
        next: (lista) => {
          this.filas.set(
            lista.map((m, id) => ({
              id,
              m,
              clave: normalizar(`${m.nombre} ${m.monodroga} ${m.troquel}`),
            })),
          );
          this.cargando.set(false);
        },
        error: () => {
          this.error.set(true);
          this.cargando.set(false);
        },
      });
    });
  }

  buscar(texto: string): void {
    this.consulta.set(texto);
    this.pagina.set(1);
  }

  irA(pagina: number): void {
    this.pagina.set(Math.min(Math.max(1, pagina), this.totalPaginas()));
    // Sin esto, al pasar de página se queda mirando el final de la anterior.
    this.resultados()?.nativeElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  alternar(id: number): void {
    this.abiertas.update((actual) => {
      const nuevo = new Set(actual);
      if (!nuevo.delete(id)) nuevo.add(id);
      return nuevo;
    });
  }

  numero(n: number): string {
    return n.toLocaleString('es-AR');
  }
}
