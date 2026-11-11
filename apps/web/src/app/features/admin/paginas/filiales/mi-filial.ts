import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { PERMISOS } from '@cirsub/shared';
import { PanelService, type FilialPanel } from '../../../../core/servicios/panel.service';
import { SesionService } from '../../../../core/servicios/sesion.service';

/**
 * La ficha de contacto de una filial.
 *
 * Un referente entra y ve la suya, sin elegir: tiene una sola. Quien administra
 * todas ve la lista y elige cuál editar.
 *
 * Sólo se muestran los campos que se pueden tocar. El nombre y la ubicación en el
 * mapa quedan afuera porque identifican a la filial en la portada y en lo que
 * leen los buscadores; el servidor los protege igual, así que esto es sólo para
 * no ofrecer lo que después va a rechazar.
 */
@Component({
  selector: 'app-mi-filial',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './mi-filial.html',
  styleUrls: ['../../componentes/panel.css', './mi-filial.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MiFilial implements OnInit {
  private readonly panel = inject(PanelService);
  private readonly sesion = inject(SesionService);

  readonly filiales = signal<readonly FilialPanel[]>([]);
  readonly elegidaId = signal<string | null>(null);
  readonly cargando = signal(true);
  readonly guardando = signal(false);
  readonly mensaje = signal<{ tipo: 'ok' | 'error'; texto: string } | null>(null);

  /** Con alcance propio hay una sola filial y no se elige. */
  readonly soloLaPropia = computed(
    () => this.sesion.alcance(PERMISOS.FILIALES_EDITAR) === 'propio',
  );

  readonly elegida = computed(
    () => this.filiales().find((f) => f.id === this.elegidaId()) ?? null,
  );

  // Lo que se edita, aparte de la lista: así se puede descartar sin recargar.
  readonly direccion = signal('');
  readonly telefono = signal('');
  readonly email = signal('');

  readonly hayCambios = computed(() => {
    const f = this.elegida();
    if (!f) return false;
    return (
      this.direccion() !== (f.direccion ?? '') ||
      this.telefono() !== (f.telefono ?? '') ||
      this.email() !== (f.email ?? '')
    );
  });

  ngOnInit(): void {
    this.panel.filiales().subscribe({
      next: (lista) => {
        const propia = this.sesion.usuario()?.filial?.id ?? null;
        const visibles = this.soloLaPropia() ? lista.filter((f) => f.id === propia) : lista;

        this.filiales.set(visibles);
        this.cargando.set(false);
        if (visibles.length > 0) this.elegir(visibles[0].id);
      },
      error: () => {
        this.cargando.set(false);
        this.mensaje.set({ tipo: 'error', texto: 'No pudimos cargar las filiales.' });
      },
    });
  }

  elegir(id: string): void {
    this.elegidaId.set(id);
    this.mensaje.set(null);

    const f = this.filiales().find((x) => x.id === id);
    this.direccion.set(f?.direccion ?? '');
    this.telefono.set(f?.telefono ?? '');
    this.email.set(f?.email ?? '');
  }

  descartar(): void {
    const id = this.elegidaId();
    if (id) this.elegir(id);
  }

  guardar(): void {
    const filial = this.elegida();
    if (!filial || this.guardando()) return;

    this.guardando.set(true);
    this.mensaje.set(null);

    /*
      Va la filial entera porque el endpoint la espera completa, con los campos
      que no se editan tal como vinieron. De los que sí se editan, el texto vacío
      se manda como nulo: una dirección en blanco es «no hay dato», no una
      dirección que es una cadena vacía.
    */
    const enBlanco = (valor: string) => valor.trim() || null;

    this.panel
      .guardarFilial(filial.id, {
        nombre: filial.nombre,
        direccion: enBlanco(this.direccion()),
        telefono: enBlanco(this.telefono()),
        email: enBlanco(this.email()),
        lat: filial.lat,
        lng: filial.lng,
        svgX: filial.svgX,
        svgY: filial.svgY,
        fotoId: filial.fotoId,
        orden: filial.orden,
        activa: filial.activa,
      })
      .subscribe({
        next: (guardada) => {
          this.filiales.update((lista) =>
            lista.map((f) => (f.id === guardada.id ? guardada : f)),
          );
          this.elegir(guardada.id);
          this.guardando.set(false);
          this.mensaje.set({ tipo: 'ok', texto: 'Listo, los datos quedaron guardados.' });
        },
        error: (e: { error?: { message?: string } }) => {
          this.guardando.set(false);
          this.mensaje.set({
            tipo: 'error',
            texto: e.error?.message ?? 'No pudimos guardar los cambios.',
          });
        },
      });
  }
}
