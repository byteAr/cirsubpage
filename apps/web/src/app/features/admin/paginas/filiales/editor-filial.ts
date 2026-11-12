import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import {
  LIMITES_FICHA,
  PERMISOS,
  TIPO_CONTACTO,
  TIPOS_CONTACTO,
  problemaDeContacto,
  type FichaFilial,
  type ServicioHotel,
  type TipoContacto,
} from '@cirsub/shared';
import { PanelService, type CambioPendiente } from '../../../../core/servicios/panel.service';
import { SesionService } from '../../../../core/servicios/sesion.service';

interface FilaContacto {
  tipo: TipoContacto;
  valor: string;
  etiqueta: string;
}

interface FilaConvenio {
  nombre: string;
  beneficio: string;
  detalle: string;
  vigenteHasta: string;
}

/** Los datos de una filial. El usuario de la filial propone; un administrador aprueba. */
@Component({
  selector: 'app-editor-filial',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './editor-filial.html',
  styleUrls: ['../../componentes/panel.css', './editor-filial.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EditorFilial implements OnInit {
  private readonly panel = inject(PanelService);
  private readonly ruta = inject(ActivatedRoute);
  private readonly sesion = inject(SesionService);

  readonly tipos = TIPOS_CONTACTO;
  readonly serviciosDisponibles = signal<readonly ServicioHotel[]>([]);
  readonly limites = LIMITES_FICHA;

  readonly cargando = signal(true);
  readonly guardando = signal(false);
  readonly error = signal<string | null>(null);
  readonly exito = signal<string | null>(null);

  readonly id = signal('');
  readonly nombre = signal('');
  readonly pendiente = signal<CambioPendiente | null>(null);
  readonly rechazo = signal<CambioPendiente | null>(null);

  readonly direccion = signal('');
  readonly contactos = signal<FilaContacto[]>([]);
  readonly tieneHotel = signal(false);
  readonly habitaciones = signal<number | null>(null);
  readonly serviciosHotel = signal<readonly string[]>([]);
  readonly convenios = signal<FilaConvenio[]>([]);

  readonly apruebaDirecto = computed(() => this.sesion.puede(PERMISOS.CAMBIOS_APROBAR));
  readonly puedeVolverALista = computed(
    () => this.sesion.alcance(PERMISOS.FILIALES_EDITAR) === 'todos',
  );

  readonly problemas = computed(() => {
    const lista: string[] = [];
    if (this.apruebaDirecto() && this.direccion().trim().length < 5) {
      lista.push('Falta la dirección de la filial.');
    }
    for (const c of this.contactos()) {
      const p = problemaDeContacto(c.tipo, c.valor);
      if (p) lista.push(`${this.nombreTipo(c.tipo)}: ${p}`);
    }
    if (this.tieneHotel()) {
      const n = this.habitaciones();
      if (n === null || !Number.isInteger(n) || n < 0) {
        lista.push('Indicá cuántas habitaciones tiene el hotel.');
      }
    }
    for (const c of this.convenios()) {
      if (c.nombre.trim().length < 2) lista.push('Falta con quién es uno de los convenios.');
      if (c.beneficio.trim().length < 2) lista.push('Falta el beneficio de uno de los convenios.');
    }
    return [...new Set(lista)];
  });

  ngOnInit(): void {
    this.id.set(this.ruta.snapshot.paramMap.get('id') ?? '');
    this.panel.serviciosHotel().subscribe({ next: (l) => this.serviciosDisponibles.set(l) });
    this.panel.fichaFilial(this.id()).subscribe({
      next: (r) => {
        this.nombre.set(r.nombre);
        this.pendiente.set(r.pendiente);
        this.rechazo.set(r.ultimoRechazo);
        // Si hay algo esperando o rechazado, se sigue trabajando sobre eso y no se
        // pierde lo que ya cargó.
        const base = (r.pendiente?.datos ?? r.ultimoRechazo?.datos ?? r.ficha) as FichaFilial;
        this.aplicarFicha(base);
        this.cargando.set(false);
      },
      error: () => {
        this.error.set('No pudimos cargar los datos de la filial.');
        this.cargando.set(false);
      },
    });
  }

  nombreTipo(tipo: string): string {
    return TIPOS_CONTACTO.find((t) => t.id === tipo)?.nombre ?? tipo;
  }

  ejemploTipo(tipo: string): string {
    return TIPOS_CONTACTO.find((t) => t.id === tipo)?.ejemplo ?? '';
  }

  alternarServicio(id: string, marcado: boolean): void {
    this.serviciosHotel.update((l) => (marcado ? [...l, id] : l.filter((s) => s !== id)));
  }

  agregarContacto(): void {
    this.contactos.update((c) => [...c, { tipo: TIPO_CONTACTO.WHATSAPP, valor: '', etiqueta: '' }]);
  }

  agregarConvenio(): void {
    this.convenios.update((c) => [
      ...c,
      { nombre: '', beneficio: '', detalle: '', vigenteHasta: '' },
    ]);
  }

  quitarContacto(i: number): void {
    this.contactos.update((c) => c.filter((_, x) => x !== i));
  }

  quitarConvenio(i: number): void {
    this.convenios.update((c) => c.filter((_, x) => x !== i));
  }

  cambiarContacto(i: number, campo: keyof FilaContacto, valor: string): void {
    this.contactos.update((c) => c.map((f, x) => (x === i ? { ...f, [campo]: valor } : f)));
  }

  cambiarConvenio(i: number, campo: keyof FilaConvenio, valor: string): void {
    this.convenios.update((c) => c.map((f, x) => (x === i ? { ...f, [campo]: valor } : f)));
  }

  async guardar(): Promise<void> {
    if (this.guardando() || this.problemas().length > 0) return;

    this.guardando.set(true);
    this.error.set(null);
    this.exito.set(null);

    const datos: FichaFilial = {
      direccion: this.direccion().trim(),
      contactos: this.contactos().map((c) => ({
        tipo: c.tipo,
        valor: c.valor.trim(),
        etiqueta: c.etiqueta.trim() || null,
      })),
      habitaciones: this.tieneHotel() ? this.habitaciones() : null,
      serviciosHotel: this.tieneHotel() ? [...this.serviciosHotel()] : [],
      convenios: this.convenios().map((c) => ({
        nombre: c.nombre.trim(),
        beneficio: c.beneficio.trim(),
        detalle: c.detalle.trim() || null,
        vigenteHasta: c.vigenteHasta || null,
      })),
    };

    try {
      const r = await firstValueFrom(this.panel.guardarFichaFilial(this.id(), datos));
      this.rechazo.set(null);
      if (r.aplicado) {
        this.pendiente.set(null);
        this.exito.set('Listo: los datos ya se ven en la página.');
      } else {
        this.pendiente.set(r.cambio);
        this.exito.set('Enviado. La página cambia cuando un administrador lo apruebe.');
      }
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (e) {
      const m = (e as { error?: { message?: string | string[] } }).error?.message;
      this.error.set(Array.isArray(m) ? m.join(' ') : (m ?? 'No pudimos guardar los datos.'));
    } finally {
      this.guardando.set(false);
    }
  }

  private aplicarFicha(f: FichaFilial): void {
    this.direccion.set(f.direccion);
    this.contactos.set(
      f.contactos.map((c) => ({ tipo: c.tipo, valor: c.valor, etiqueta: c.etiqueta ?? '' })),
    );
    this.tieneHotel.set(f.habitaciones !== null);
    this.habitaciones.set(f.habitaciones);
    this.serviciosHotel.set(f.serviciosHotel ?? []);
    this.convenios.set(
      f.convenios.map((c) => ({
        nombre: c.nombre,
        beneficio: c.beneficio,
        detalle: c.detalle ?? '',
        vigenteHasta: c.vigenteHasta?.slice(0, 10) ?? '',
      })),
    );
  }
}
