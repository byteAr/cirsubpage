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
 * no se recalcula más de una vez por cuadro. Además:
 *
 *   - El escucha de scroll sólo está puesto mientras la sección se ve. La
 *     portada mide más de ocho mil píxeles y esta sección ocupa un tramo; sin
 *     esto se recalculaban las diecinueve posiciones en cada cuadro de scroll
 *     de toda la página, la mayoría de las veces para nada.
 *   - Los elementos se buscan una vez y quedan guardados, en vez de recorrer el
 *     árbol tres veces por cuadro.
 *   - Sólo se escribe lo que cambió. Con seis tramos, en un cuadro cualquiera se
 *     mueven dos o tres; escribir los diecinueve igual obliga al navegador a
 *     recalcular estilos de más.
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
  private escuchando = false;
  private observador?: IntersectionObserver;

  /** Los elementos que se mueven, buscados una sola vez. */
  private bloques: HTMLElement[] = [];
  private pantallas: HTMLElement[] = [];
  private puntos: HTMLElement[] = [];

  /** Lo último escrito en cada uno, para no repetir la escritura. */
  private ultimoBloque: string[] = [];
  private ultimaPantalla: string[] = [];
  private ultimoPunto: boolean[] = [];
  private ultimoTelefono = '';

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
      // Sin movimiento: las seis pantallas quedan apiladas y visibles.
      this.pista().nativeElement.classList.add('sin-movimiento');
      return;
    }

    this.recolectar();
    window.addEventListener('resize', this.alRedimensionar);

    /*
      Se empieza escuchando y es el observador el que suelta, no al revés.

      Así, si el observador no llegara a avisar nunca, lo peor que pasa es que se
      escuche todo el tiempo, que es lo que hacía antes: la sección sigue
      animándose igual. Al revés —esperar el aviso para enganchar— un observador
      que no dispara dejaría el teléfono quieto para siempre, que es una falla
      mucho peor que la que se está tratando de evitar.

      El margen le da un respiro: la sección empieza a calcularse un poco antes
      de asomar, así el teléfono ya está en su posición cuando se lo ve entrar y
      no aparece dando un salto.
    */
    this.escuchar(true);

    this.observador = new IntersectionObserver(
      ([entrada]) => this.escuchar(entrada?.isIntersecting ?? false),
      { rootMargin: '200px 0px' },
    );
    this.observador.observe(this.pista().nativeElement);

    this.medirBloques();
    this.pintar();
  }

  ngOnDestroy(): void {
    if (!isPlatformBrowser(this.plataforma)) return;
    if (this.cuadroPendiente) cancelAnimationFrame(this.cuadroPendiente);
    this.observador?.disconnect();
    this.escuchar(false);
    window.removeEventListener('resize', this.alRedimensionar);
  }

  private recolectar(): void {
    const pista = this.pista().nativeElement;
    this.bloques = [...pista.querySelectorAll<HTMLElement>('[data-bloque]')];
    this.pantallas = [...pista.querySelectorAll<HTMLElement>('[data-pantalla]')];
    this.puntos = [...pista.querySelectorAll<HTMLElement>('[data-punto]')];
    this.ultimoBloque = new Array(this.bloques.length).fill('');
    this.ultimaPantalla = new Array(this.pantallas.length).fill('');
    this.ultimoPunto = new Array(this.puntos.length).fill(false);
  }

  private escuchar(activar: boolean): void {
    if (activar === this.escuchando) return;
    this.escuchando = activar;

    if (activar) {
      window.addEventListener('scroll', this.alDesplazar, { passive: true });
      this.alDesplazar();
    } else {
      window.removeEventListener('scroll', this.alDesplazar);
    }
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
    if (!pila || this.bloques.length === 0) return;

    // El alto se toma sin la traslación que les aplica el desplazamiento.
    const alto = Math.max(...this.bloques.map((b) => b.scrollHeight));
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

    this.bloques.forEach((bloque, i) => {
      const distancia = (avance - i * segmento) / segmento;
      const opacidad = Math.max(0, 1 - Math.abs(distancia) * 1.35).toFixed(2);
      const y = (-distancia * 46).toFixed(1);
      const clave = `${opacidad}|${y}`;
      if (clave === this.ultimoBloque[i]) return;
      this.ultimoBloque[i] = clave;

      bloque.style.opacity = opacidad;
      bloque.style.transform = `translateY(${y}px)`;
      bloque.style.pointerEvents = Math.abs(distancia) < 0.5 ? 'auto' : 'none';
    });

    this.pantallas.forEach((pantalla, i) => {
      const distancia = (avance - i * segmento) / segmento;
      const opacidad = Math.max(0, 1 - Math.abs(distancia) * 1.7).toFixed(2);
      const y = (-distancia * 26).toFixed(1);
      const clave = `${opacidad}|${y}`;
      if (clave === this.ultimaPantalla[i]) return;
      this.ultimaPantalla[i] = clave;

      pantalla.style.opacity = opacidad;
      pantalla.style.transform = `translateY(${y}px)`;
    });

    this.puntos.forEach((punto, i) => {
      const activo = Math.abs((avance - i * segmento) / segmento) < 0.5;
      if (activo === this.ultimoPunto[i]) return;
      this.ultimoPunto[i] = activo;

      punto.classList.toggle('punto-activo', activo);
    });

    // Rotación de -14° a +14° en el eje vertical, con el horizontal invertido,
    // más una flotación sinusoidal y un achicamiento sobre el final.
    const giroY = -14 + 28 * avance;
    const giroX = 6 - 12 * avance;
    const flotacion = -10 * Math.sin(avance * Math.PI);
    const escala = avance > 0.8 ? 1 - ((avance - 0.8) / 0.2) * 0.14 : 1;

    const transformacion =
      `translateY(${flotacion.toFixed(1)}px) rotateY(${giroY.toFixed(1)}deg) ` +
      `rotateX(${giroX.toFixed(1)}deg) scale(${escala.toFixed(3)})`;

    if (transformacion !== this.ultimoTelefono) {
      this.ultimoTelefono = transformacion;
      telefono.style.transform = transformacion;
    }
  }
}
