import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { firstValueFrom } from 'rxjs';
import {
  PERMISOS,
  problemaDePlan,
  type PlanPrestamo,
  type SimuladorPrestamos,
} from '@cirsub/shared';
import { PanelService, type CambioPendiente } from '../../../../core/servicios/panel.service';
import { SesionService } from '../../../../core/servicios/sesion.service';

interface FilaPlan {
  cuotas: number | null;
  coeficiente: number | null;
}

const PESOS = new Intl.NumberFormat('es-AR', {
  style: 'currency',
  currency: 'ARS',
  maximumFractionDigits: 0,
});

/** Planes y coeficientes del simulador público. Un usuario propone; un administrador aprueba. */
@Component({
  selector: 'app-simulador-panel',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './simulador.html',
  styleUrls: ['../../componentes/panel.css', './simulador.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Simulador implements OnInit {
  private readonly panel = inject(PanelService);
  private readonly sesion = inject(SesionService);

  readonly cargando = signal(true);
  readonly guardando = signal(false);
  readonly error = signal<string | null>(null);
  readonly exito = signal<string | null>(null);
  readonly pendiente = signal<CambioPendiente | null>(null);
  readonly filas = signal<FilaPlan[]>([]);

  readonly apruebaDirecto = computed(() => this.sesion.puede(PERMISOS.CAMBIOS_APROBAR));

  readonly problemas = computed(() => {
    const filas = this.filas();
    if (filas.length === 0) return ['Agregá al menos un plan.'];

    const lista: string[] = [];
    for (const f of filas) {
      if (f.cuotas === null || f.coeficiente === null) {
        lista.push('Completá las cuotas y el coeficiente de todos los planes.');
        continue;
      }
      const p = problemaDePlan({ cuotas: f.cuotas, coeficiente: f.coeficiente });
      if (p) lista.push(p);
    }
    if (new Set(filas.map((f) => f.cuotas)).size !== filas.length) {
      lista.push('Hay dos planes con la misma cantidad de cuotas.');
    }
    return [...new Set(lista)];
  });

  ngOnInit(): void {
    this.panel.simulador().subscribe({
      next: ({ actual, pendiente }) => {
        this.filas.set(actual.planes.map((p) => ({ ...p })));
        this.pendiente.set(pendiente);
        this.cargando.set(false);
      },
      error: () => {
        this.error.set('No pudimos cargar el simulador.');
        this.cargando.set(false);
      },
    });
  }

  agregar(): void {
    this.filas.update((f) => [...f, { cuotas: null, coeficiente: null }]);
  }

  quitar(i: number): void {
    this.filas.update((f) => f.filter((_, indice) => indice !== i));
  }

  cambiar(i: number, campo: keyof FilaPlan, valor: number | null): void {
    this.filas.update((f) => f.map((fila, x) => (x === i ? { ...fila, [campo]: valor } : fila)));
  }

  /** Un ejemplo concreto: es la forma más rápida de notar un coeficiente mal tipeado. */
  ejemplo(f: FilaPlan): string {
    if (!f.coeficiente || f.coeficiente <= 0) return '—';
    return PESOS.format(Math.floor(100_000 / f.coeficiente));
  }

  async guardar(): Promise<void> {
    if (this.guardando() || this.problemas().length > 0) return;

    this.guardando.set(true);
    this.error.set(null);
    this.exito.set(null);

    const datos: SimuladorPrestamos = {
      planes: this.filas().map((f) => ({ cuotas: f.cuotas, coeficiente: f.coeficiente }) as PlanPrestamo),
    };

    try {
      const r = await firstValueFrom(this.panel.guardarSimulador(datos));
      if (r.aplicado) {
        this.pendiente.set(null);
        this.exito.set('Listo: el simulador de la página ya usa estos planes.');
      } else {
        this.pendiente.set(r.cambio);
        this.exito.set('Enviado. La página cambia cuando un administrador lo apruebe.');
      }
    } catch (e) {
      const m = (e as { error?: { message?: string | string[] } }).error?.message;
      this.error.set(Array.isArray(m) ? m.join(' ') : (m ?? 'No pudimos guardar los planes.'));
    } finally {
      this.guardando.set(false);
    }
  }
}
