import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { SIMULADOR_INICIAL } from '@cirsub/shared';
import { ContenidoService } from '../../../core/servicios/contenido.service';

const PESOS = new Intl.NumberFormat('es-AR', {
  style: 'currency',
  currency: 'ARS',
  maximumFractionDigits: 0,
});

/**
 * Simulador de préstamos personales.
 *
 * Cada coeficiente es la cuota mensual que corresponde a un peso prestado en ese
 * plazo: con 0,168986 en 12 cuotas, $1 se paga con 12 cuotas de $0,168986. Por
 * eso el monto sale de dividir el disponible por el coeficiente. Los planes se
 * administran desde el panel y, si la API no responde, se usan los iniciales.
 *
 * Se ingresa el disponible —lo que se le puede descontar del haber por mes, que
 * la persona conoce por su recibo— y se muestra cuánto puede pedir en cada plazo.
 * La cuota de todos los planes es el disponible entero: lo que cambia es el monto
 * y cuánto se termina devolviendo.
 *
 * Los montos se redondean hacia abajo. Es una simulación, y prometer un peso de
 * más que después no se otorga es peor que quedarse corto.
 */
@Component({
  selector: 'app-calculadora-prestamo',
  standalone: true,
  templateUrl: './calculadora-prestamo.html',
  styleUrl: './calculadora-prestamo.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CalculadoraPrestamo {
  private readonly contenido = inject(ContenidoService);
  private readonly simulador = toSignal(this.contenido.simulador(), {
    initialValue: SIMULADOR_INICIAL,
  });

  /** Lo que se escribió, tal cual; se admite con puntos de miles. */
  readonly texto = signal('');

  readonly disponible = computed(() => {
    const soloDigitos = this.texto().replace(/\D/g, '');
    const valor = Number(soloDigitos);
    return Number.isFinite(valor) && valor > 0 ? valor : 0;
  });

  readonly planes = computed(() => {
    const disponible = this.disponible();
    return this.simulador().planes.map((p) => ({
      cuotas: p.cuotas,
      monto: Math.floor(disponible / p.coeficiente),
      cuota: disponible,
    }));
  });

  alEscribir(evento: Event): void {
    const campo = evento.target as HTMLInputElement;
    const soloDigitos = campo.value.replace(/\D/g, '').slice(0, 9);

    /*
      Se reescribe con puntos de miles mientras se tipea: con importes de seis
      cifras es fácil equivocarse en un cero, y así se ve enseguida.
    */
    const formateado = soloDigitos ? Number(soloDigitos).toLocaleString('es-AR') : '';
    campo.value = formateado;
    this.texto.set(formateado);
  }

  pesos(valor: number): string {
    return PESOS.format(valor);
  }
}
