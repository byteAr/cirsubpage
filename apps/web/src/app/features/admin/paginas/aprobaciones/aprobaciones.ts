import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import {
  ESTADO_NOVEDAD,
  TIPO_CAMBIO,
  TIPOS_CONTACTO,
  type ContactoFilial,
  type ConvenioFilial,
  type FichaFilial,
  type SimuladorPrestamos,
} from '@cirsub/shared';
import { PanelService, type CambioPendiente } from '../../../../core/servicios/panel.service';

interface Diferencia {
  readonly campo: string;
  readonly antes: string;
  readonly despues: string;
}

const textoContactos = (lista: readonly ContactoFilial[]): string =>
  lista
    .map((c) => {
      const tipo = TIPOS_CONTACTO.find((t) => t.id === c.tipo)?.nombre ?? c.tipo;
      return `${tipo}${c.etiqueta ? ` (${c.etiqueta})` : ''}: ${c.valor}`;
    })
    .join('\n') || 'Sin contactos';

const textoConvenios = (lista: readonly ConvenioFilial[]): string =>
  lista
    .map((c) => `${c.nombre}: ${c.beneficio}${c.vigenteHasta ? ` (hasta ${c.vigenteHasta.slice(0, 10)})` : ''}`)
    .join('\n') || 'Sin convenios';

const textoPlanes = (s: SimuladorPrestamos): string =>
  s.planes.map((p) => `${p.cuotas} cuotas: ${p.coeficiente}`).join('\n');

/**
 * Bandeja del administrador.
 *
 * Muestra solo lo que cambia: quien aprueba tiene que poder decidir mirando la
 * diferencia, no comparando dos fichas enteras de memoria.
 */
@Component({
  selector: 'app-aprobaciones',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './aprobaciones.html',
  styleUrls: ['../../componentes/panel.css', './aprobaciones.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Aprobaciones implements OnInit {
  private readonly panel = inject(PanelService);

  readonly cargando = signal(true);
  readonly cambios = signal<readonly CambioPendiente[]>([]);
  readonly novedadesEnRevision = signal(0);
  readonly error = signal<string | null>(null);
  readonly exito = signal<string | null>(null);
  readonly ocupado = signal<string | null>(null);

  /** El cambio que se está por rechazar, para pedirle el motivo. */
  readonly rechazando = signal<CambioPendiente | null>(null);
  readonly motivo = signal('');

  ngOnInit(): void {
    this.cargar();
  }

  titulo(c: CambioPendiente): string {
    return c.tipo === TIPO_CAMBIO.SIMULADOR
      ? 'Simulador de préstamos'
      : (c.filial?.nombre ?? 'Filial');
  }

  diferencias(c: CambioPendiente): Diferencia[] {
    if (c.tipo === TIPO_CAMBIO.SIMULADOR) {
      return this.filtrar([
        {
          campo: 'Planes',
          antes: textoPlanes(c.anterior as SimuladorPrestamos),
          despues: textoPlanes(c.datos as SimuladorPrestamos),
        },
      ]);
    }

    const a = c.anterior as FichaFilial;
    const d = c.datos as FichaFilial;
    const hotel = (n: number | null) => (n === null ? 'Sin hotel propio' : `${n} habitaciones`);
    const pin = (f: FichaFilial) => `${f.lat.toFixed(5)}, ${f.lng.toFixed(5)}`;

    return this.filtrar([
      { campo: 'Dirección', antes: a.direccion || 'Sin dirección', despues: d.direccion },
      { campo: 'Ubicación en el mapa', antes: pin(a), despues: pin(d) },
      { campo: 'Contactos', antes: textoContactos(a.contactos), despues: textoContactos(d.contactos) },
      { campo: 'Capacidad', antes: hotel(a.habitaciones), despues: hotel(d.habitaciones) },
      { campo: 'Convenios', antes: textoConvenios(a.convenios), despues: textoConvenios(d.convenios) },
    ]);
  }

  async aprobar(c: CambioPendiente): Promise<void> {
    this.ocupado.set(c.id);
    this.limpiarAvisos();
    try {
      await firstValueFrom(this.panel.aprobarCambio(c.id));
      this.cambios.update((l) => l.filter((x) => x.id !== c.id));
      this.exito.set(`Aprobado: ${this.titulo(c)} ya se ve en la página.`);
    } catch (e) {
      this.mostrarError(e, 'No pudimos aprobar el cambio.');
    } finally {
      this.ocupado.set(null);
    }
  }

  async confirmarRechazo(): Promise<void> {
    const c = this.rechazando();
    if (!c) return;

    this.ocupado.set(c.id);
    this.limpiarAvisos();
    try {
      await firstValueFrom(this.panel.rechazarCambio(c.id, this.motivo().trim()));
      this.cambios.update((l) => l.filter((x) => x.id !== c.id));
      this.exito.set(`Rechazado. ${c.autor.nombre} va a ver el motivo cuando entre.`);
      this.rechazando.set(null);
      this.motivo.set('');
    } catch (e) {
      this.mostrarError(e, 'No pudimos rechazar el cambio.');
    } finally {
      this.ocupado.set(null);
    }
  }

  private filtrar(lista: Diferencia[]): Diferencia[] {
    return lista.filter((d) => d.antes !== d.despues);
  }

  private limpiarAvisos(): void {
    this.error.set(null);
    this.exito.set(null);
  }

  private mostrarError(e: unknown, porDefecto: string): void {
    const m = (e as { error?: { message?: string | string[] } }).error?.message;
    this.error.set(Array.isArray(m) ? m.join(' ') : (m ?? porDefecto));
  }

  private cargar(): void {
    this.panel.cambios().subscribe({
      next: (c) => {
        this.cambios.set(c);
        this.cargando.set(false);
      },
      error: () => {
        this.error.set('No pudimos cargar los cambios.');
        this.cargando.set(false);
      },
    });
    this.panel.novedades({ estado: ESTADO_NOVEDAD.EN_REVISION }).subscribe({
      next: (r) => this.novedadesEnRevision.set(r.total),
    });
  }
}
