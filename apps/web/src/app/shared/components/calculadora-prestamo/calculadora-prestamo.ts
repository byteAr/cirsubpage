import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';

interface Plan {
  readonly cuotas: number;
  /** Cuota mensual por cada peso prestado. */
  readonly coeficiente: number;
}

/**
 * Coeficientes del Departamento de Gestión de Préstamos y Convenios, vigentes
 * desde septiembre de 2026.
 *
 * Cada uno es la cuota mensual que corresponde a un peso prestado en ese plazo:
 * con 0,168986 en 12 cuotas, un préstamo de $1 se paga con 12 cuotas de
 * $0,168986. Por eso el monto que se puede pedir sale de dividir lo que la
 * persona tiene disponible por mes entre el coeficiente, y no de multiplicarlo:
 * multiplicando, $100.000 disponibles en 12 cuotas darían un préstamo de $16.899,
 * seis veces menos que la propia cuota.
 */
const PLANES: readonly Plan[] = [
  { cuotas: 9, coeficiente: 0.194869 },
  { cuotas: 12, coeficiente: 0.168986 },
  { cuotas: 18, coeficiente: 0.118046 },
  { cuotas: 26, coeficiente: 0.095352 },
];

const PESOS = new Intl.NumberFormat('es-AR', {
  style: 'currency',
  currency: 'ARS',
  maximumFractionDigits: 0,
});

/**
 * Simulador de préstamos personales.
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
  /** Lo que se escribió, tal cual; se admite con puntos de miles. */
  readonly texto = signal('');

  readonly disponible = computed(() => {
    const soloDigitos = this.texto().replace(/\D/g, '');
    const valor = Number(soloDigitos);
    return Number.isFinite(valor) && valor > 0 ? valor : 0;
  });

  readonly planes = computed(() => {
    const disponible = this.disponible();
    return PLANES.map((p) => ({
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
