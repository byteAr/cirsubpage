import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { firstValueFrom } from 'rxjs';
import {
  ICONOS_SERVICIO,
  LIMITES_SERVICIOS_HOTEL,
  type IconoServicio,
} from '@cirsub/shared';
import { PanelService } from '../../../../core/servicios/panel.service';
import { IconoFichaComponent } from '../../../../shared/components/ficha-filial/icono-ficha';

interface FilaServicio {
  id: string | null;
  nombre: string;
  icono: IconoServicio;
}

/**
 * Los servicios que pueden ofrecer las habitaciones de las filiales.
 *
 * Lo edita quien administra todas las filiales. Lo que se agrega aparece como
 * casilla en la ficha de cada filial; lo que se quita se desmarca de todas.
 */
@Component({
  selector: 'app-catalogo-servicios',
  standalone: true,
  imports: [FormsModule, IconoFichaComponent],
  template: `
    <section class="tarjeta">
      <div class="tarjeta-titulo"><h2>Servicios del hotel</h2></div>
      <p class="intro">
        Lo que pueden marcar las filiales que tienen hotel. Lo que agregues aparece en su ficha
        para que lo elijan; lo que quites deja de mostrarse en todas.
      </p>

      @if (error(); as e) {
        <div class="aviso aviso-error" role="alert">{{ e }}</div>
      }
      @if (exito(); as e) {
        <div class="aviso aviso-exito">{{ e }}</div>
      }

      @for (s of filas(); track $index; let i = $index) {
        <div class="servicio">
          <div class="icono-caja">
            <button type="button" class="icono-boton" (click)="eligiendo.set(eligiendo() === i ? null : i)"
                    [attr.aria-expanded]="eligiendo() === i" [attr.aria-label]="'Cambiar el ícono de ' + s.nombre">
              <app-icono-ficha [nombre]="s.icono" />
            </button>
            @if (eligiendo() === i) {
              <div class="galeria" role="listbox" aria-label="Elegí un ícono">
                @for (ic of iconos; track ic.id) {
                  <button type="button" role="option" [attr.aria-selected]="ic.id === s.icono"
                          [class.elegido]="ic.id === s.icono" [title]="ic.nombre" (click)="elegir(i, ic.id)">
                    <app-icono-ficha [nombre]="ic.id" />
                  </button>
                }
              </div>
            }
          </div>
          <label class="campo">
            <span class="oculto">Nombre del servicio</span>
            <input type="text" [maxlength]="limites.NOMBRE" placeholder="Por ejemplo: Estacionamiento"
                   [ngModel]="s.nombre" (ngModelChange)="cambiarNombre(i, $event)" />
          </label>
          <button type="button" class="btn btn-secundario btn-chico" (click)="quitar(i)">Quitar</button>
        </div>
      } @empty {
        <p class="intro">No hay servicios cargados.</p>
      }

      <div class="pie">
        <button type="button" class="btn btn-secundario" (click)="agregar()"
                [disabled]="filas().length >= limites.CANTIDAD">+ Agregar un servicio</button>
        <button type="button" class="btn btn-primario" (click)="guardar()"
                [disabled]="guardando() || !valido() || !hayCambios()">Guardar los servicios</button>
      </div>
    </section>
  `,
  styleUrls: ['../../componentes/panel.css'],
  styles: `
    .intro {
      margin: 0 0 14px;
      color: var(--color-pizarra);
    }

    .servicio {
      display: grid;
      grid-template-columns: auto 1fr auto;
      align-items: center;
      gap: 12px;
      padding: 10px 0;
      border-top: 1px solid var(--color-borde);
    }

    .servicio .campo {
      margin: 0;
      min-width: 0;
    }

    .oculto {
      position: absolute;
      width: 1px;
      height: 1px;
      overflow: hidden;
      clip: rect(0 0 0 0);
    }

    .icono-caja {
      position: relative;
    }

    .icono-boton {
      display: grid;
      place-items: center;
      width: 46px;
      height: 46px;
      padding: 10px;
      border: 1.5px solid var(--color-borde);
      border-radius: 12px;
      background: var(--color-nube);
      color: var(--color-teal-hondo, var(--color-teal));
      cursor: pointer;
    }

    .icono-boton app-icono-ficha {
      width: 24px;
      height: 24px;
    }

    .galeria {
      position: absolute;
      top: calc(100% + 6px);
      left: 0;
      z-index: 20;
      display: grid;
      grid-template-columns: repeat(6, 42px);
      gap: 4px;
      padding: 10px;
      border-radius: 14px;
      background: #ffffff;
      box-shadow: var(--shadow-alta, 0 12px 30px rgb(9 28 40 / 0.18));
    }

    .galeria button {
      display: grid;
      place-items: center;
      width: 42px;
      height: 42px;
      padding: 10px;
      border: 1.5px solid transparent;
      border-radius: 10px;
      background: transparent;
      color: var(--color-tinta);
      cursor: pointer;
    }

    .galeria button:hover {
      background: var(--color-nube);
    }

    .galeria button.elegido {
      border-color: var(--color-azul);
      background: var(--color-nube);
      color: var(--color-azul);
    }

    .galeria app-icono-ficha {
      width: 20px;
      height: 20px;
    }

    .pie {
      display: flex;
      flex-wrap: wrap;
      justify-content: space-between;
      gap: 10px;
      margin-top: 14px;
    }

    @media (max-width: 520px) {
      .galeria {
        grid-template-columns: repeat(5, 42px);
      }
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CatalogoServicios implements OnInit {
  private readonly panel = inject(PanelService);

  readonly iconos = ICONOS_SERVICIO;
  readonly limites = LIMITES_SERVICIOS_HOTEL;

  readonly filas = signal<FilaServicio[]>([]);
  private readonly guardado = signal('');
  readonly eligiendo = signal<number | null>(null);
  readonly guardando = signal(false);
  readonly error = signal<string | null>(null);
  readonly exito = signal<string | null>(null);

  readonly hayCambios = computed(() => JSON.stringify(this.filas()) !== this.guardado());
  readonly valido = computed(() => {
    const nombres = this.filas().map((f) => f.nombre.trim().toLocaleLowerCase('es'));
    return nombres.every((n) => n.length >= 2) && new Set(nombres).size === nombres.length;
  });

  ngOnInit(): void {
    this.panel.serviciosHotel().subscribe({
      next: (l) => this.cargar(l.map((s) => ({ id: s.id, nombre: s.nombre, icono: s.icono }))),
      error: () => this.error.set('No pudimos cargar los servicios.'),
    });
  }

  agregar(): void {
    this.filas.update((f) => [...f, { id: null, nombre: '', icono: 'cama' }]);
    this.eligiendo.set(null);
  }

  quitar(i: number): void {
    this.filas.update((f) => f.filter((_, x) => x !== i));
    this.eligiendo.set(null);
  }

  cambiarNombre(i: number, nombre: string): void {
    this.filas.update((f) => f.map((s, x) => (x === i ? { ...s, nombre } : s)));
  }

  elegir(i: number, icono: IconoServicio): void {
    this.filas.update((f) => f.map((s, x) => (x === i ? { ...s, icono } : s)));
    this.eligiendo.set(null);
  }

  async guardar(): Promise<void> {
    if (this.guardando() || !this.valido()) return;
    this.guardando.set(true);
    this.error.set(null);
    this.exito.set(null);
    try {
      const l = await firstValueFrom(
        this.panel.guardarServiciosHotel(
          this.filas().map((f) => ({ ...(f.id ? { id: f.id } : {}), nombre: f.nombre.trim(), icono: f.icono })),
        ),
      );
      this.cargar(l.map((s) => ({ id: s.id, nombre: s.nombre, icono: s.icono })));
      this.exito.set('Listo: las filiales ya ven estos servicios en su ficha.');
    } catch (e) {
      const m = (e as { error?: { message?: string | string[] } }).error?.message;
      this.error.set(Array.isArray(m) ? m.join(' ') : (m ?? 'No pudimos guardar los servicios.'));
    } finally {
      this.guardando.set(false);
    }
  }

  private cargar(l: FilaServicio[]): void {
    this.filas.set(l);
    this.guardado.set(JSON.stringify(l));
    this.eligiendo.set(null);
  }
}
