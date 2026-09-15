import { CommonModule, isPlatformBrowser } from '@angular/common';
import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  OnDestroy,
  PLATFORM_ID,
  inject,
  viewChild,
} from '@angular/core';
import { environment } from '../../../../environments/environment';
import { Onda } from '../onda/onda';

interface TramoShowcase {
  readonly paso: string;
  readonly pantalla: string;
  readonly titulo: string;
  readonly texto: string;
  readonly imagen: string;
  readonly cierre?: boolean;
}

/**
 * Presentación de la Credencial Digital guiada por scroll.
 *
 * El teléfono queda fijo mientras la sección pasa, rota en tres ejes según el
 * avance y adentro se cruzan las capturas. Al costado, cada captura tiene su
 * bloque de texto.
 *
 * En pantallas chicas no cambia la idea: el equipo queda fijo arriba y el texto
 * va apareciendo debajo con el mismo recorrido. Lo único que cambia es el
 * armado de la grilla y el tamaño del equipo.
 *
 * Todo el cálculo va en un `requestAnimationFrame` encolado por el scroll, así
 * no se recalcula más de una vez por cuadro.
 */
@Component({
  selector: 'app-showcase-credencial',
  standalone: true,
  imports: [CommonModule, Onda],
  templateUrl: './showcase-credencial.html',
  styleUrl: './showcase-credencial.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ShowcaseCredencial implements AfterViewInit, OnDestroy {
  private readonly plataforma = inject(PLATFORM_ID);

  private readonly pista = viewChild.required<ElementRef<HTMLElement>>('pista');
  private readonly escenario = viewChild.required<ElementRef<HTMLElement>>('escenario');
  private readonly telefono = viewChild.required<ElementRef<HTMLElement>>('telefono');

  readonly urlCredencial = environment.urlCredencial;

  readonly tramos: readonly TramoShowcase[] = [
    {
      paso: '01',
      pantalla: 'Credencial Digital',
      titulo: 'Tu credencial, siempre a mano.',
      texto:
        'Ver tus datos, realiza trámites y gestiona tus beneficios en un solo lugar. Fácil, ágil y en tiempo real.',
      imagen: 'credencial/principal.png',
    },
    {
      paso: '02',
      pantalla: 'Reintegros',
      titulo: 'Nunca fue tan fácil solicitar tu reintegro.',
      texto:'Elegí el tipo de reintegro conforme a los servicios a los que estes adherido. carga la documentación y listo',
      imagen: 'credencial/reintegros.png',
    },
    {
      paso: '03',
      pantalla: 'Subsidios y valores',
      titulo: 'Todos los valores actualizados a la vista.',
      texto: 'Consulta el valor de las cuotas de asociado y los valores reintegrables de los subsidios.',
      imagen: 'credencial/valores.png',
    },
    {
      paso: '04',
      pantalla: 'Mis descuentos.',
      titulo: 'Verificá tus descuentos.',
      texto:
        'Podes hacer el seguimiento de los descuentos que se te relizan mes a mes cómodamente.',
      imagen: 'credencial/descuentos.png',
    },
    {
      paso: '05',
      pantalla: 'Conectado',
      titulo: 'Mantenete siempre informado',
      texto:
        'El círculo te mantendrá informado enviandote notificaciones a la app.',
      imagen: 'credencial/mensajes.png'
    },
    {
      paso: '06',
      pantalla: 'Instalación',
      titulo: 'Instalala en tu teléfono',
      texto:
        'Se agrega a la pantalla de inicio desde el navegador, como cualquier otra aplicación de forma rápida y sencilla.',
      imagen: 'credencial/principal.png',
      cierre: true,
    }
  ];

  private cuadroPendiente = 0;
  private readonly alDesplazar = (): void => {
    if (this.cuadroPendiente) return;
    this.cuadroPendiente = requestAnimationFrame(() => {
      this.cuadroPendiente = 0;
      this.pintar();
    });
  };

  private readonly alRedimensionar = (): void => {
    this.medirBloques();
    this.alDesplazar();
  };

  ngAfterViewInit(): void {
    if (!isPlatformBrowser(this.plataforma)) return;

    const reducido = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reducido) {
      // Sin movimiento: las cinco pantallas quedan apiladas y visibles.
      this.pista().nativeElement.classList.add('sin-movimiento');
      return;
    }

    window.addEventListener('scroll', this.alDesplazar, { passive: true });
    window.addEventListener('resize', this.alRedimensionar);
    this.medirBloques();
    this.pintar();
  }

  ngOnDestroy(): void {
    if (!isPlatformBrowser(this.plataforma)) return;
    if (this.cuadroPendiente) cancelAnimationFrame(this.cuadroPendiente);
    window.removeEventListener('scroll', this.alDesplazar);
    window.removeEventListener('resize', this.alRedimensionar);
  }

  /**
   * Da a la pila de bloques el alto del más alto de todos.
   *
   * Los bloques van uno encima de otro, en posición absoluta, así que ninguno
   * empuja al contenedor. Sin esta medida el contenedor se queda con el alto
   * mínimo del CSS y el bloque de cierre, que es el único que lleva botón,
   * sobresale por abajo hasta apoyarse en la ola que cierra la sección.
   *
   * Se mide en lugar de fijar un número para que siga valiendo si se agrega un
   * tramo o si un texto se hace más largo.
   */
  private medirBloques(): void {
    const pista = this.pista().nativeElement;
    const pila = pista.querySelector<HTMLElement>('.bloques');
    if (!pila) return;

    const bloques = pista.querySelectorAll<HTMLElement>('[data-bloque]');
    if (bloques.length === 0) return;

    // El alto se toma sin la traslación que les aplica el desplazamiento.
    const alto = Math.max(...[...bloques].map((b) => b.scrollHeight));
    pila.style.minHeight = `${Math.ceil(alto)}px`;
  }

  private pintar(): void {
    const pista = this.pista().nativeElement;
    const escenario = this.escenario().nativeElement;
    const telefono = this.telefono().nativeElement;

    const recorrido = pista.offsetHeight - escenario.offsetHeight;
    const avance =
      recorrido > 0
        ? Math.min(1, Math.max(0, -pista.getBoundingClientRect().top / recorrido))
        : 0;

    const segmento = 1 / (this.tramos.length - 1);

    const bloques = pista.querySelectorAll<HTMLElement>('[data-bloque]');
    const pantallas = pista.querySelectorAll<HTMLElement>('[data-pantalla]');
    const puntos = pista.querySelectorAll<HTMLElement>('[data-punto]');

    bloques.forEach((bloque, i) => {
      const distancia = (avance - i * segmento) / segmento;
      bloque.style.opacity = String(Math.max(0, 1 - Math.abs(distancia) * 1.35));
      bloque.style.transform = `translateY(${(-distancia * 46).toFixed(1)}px)`;
      bloque.style.pointerEvents = Math.abs(distancia) < 0.5 ? 'auto' : 'none';
    });

    pantallas.forEach((pantalla, i) => {
      const distancia = (avance - i * segmento) / segmento;
      pantalla.style.opacity = String(Math.max(0, 1 - Math.abs(distancia) * 1.7));
      pantalla.style.transform = `translateY(${(-distancia * 26).toFixed(1)}px)`;
    });

    puntos.forEach((punto, i) => {
      const activo = Math.abs((avance - i * segmento) / segmento) < 0.5;
      punto.classList.toggle('punto-activo', activo);
    });

    // Rotación de -14° a +14° en el eje vertical, con el horizontal invertido,
    // más una flotación sinusoidal y un achicamiento sobre el final.
    const giroY = -14 + 28 * avance;
    const giroX = 6 - 12 * avance;
    const flotacion = -10 * Math.sin(avance * Math.PI);
    const escala = avance > 0.8 ? 1 - ((avance - 0.8) / 0.2) * 0.14 : 1;

    telefono.style.transform =
      `translateY(${flotacion.toFixed(1)}px) rotateY(${giroY.toFixed(1)}deg) ` +
      `rotateX(${giroX.toFixed(1)}deg) scale(${escala.toFixed(3)})`;
  }
}
