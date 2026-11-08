import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import {
  ETIQUETA_ALCANCE_BAJA,
  ETIQUETA_ESTADO_BAJA,
  type AlcanceBaja,
  type EstadoBaja,
} from '@cirsub/shared';
import { ApiService } from '../../../../core/servicios/api.service';

interface Solicitud {
  id: string;
  nombre: string;
  dni: string;
  email: string;
  alcance: AlcanceBaja;
  detalle: string | null;
  estado: EstadoBaja;
  respuesta: string | null;
  createdAt: string;
  resueltaEn: string | null;
  resueltaPor: { nombre: string } | null;
}

/** Pedidos de eliminación de datos hechos desde la página pública. */
@Component({
  selector: 'app-bajas',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="encabezado">
      <div>
        <h1>Pedidos de baja de datos</h1>
        <p>
          Personas que pidieron eliminar su cuenta o sus datos. Verificá la identidad, hacé la
          baja en el sistema que corresponda y registrá acá lo que se hizo.
        </p>
      </div>
    </div>

    @if (error(); as e) {
      <div class="aviso aviso-error" role="alert">{{ e }}</div>
    }

    @if (cargando()) {
      <div class="esqueleto" style="height: 180px"></div>
    } @else if (solicitudes().length === 0) {
      <div class="tarjeta vacio">No llegó ningún pedido.</div>
    } @else {
      <div class="lista">
        @for (s of solicitudes(); track s.id) {
          <article class="tarjeta">
            <div class="fila">
              <h2>{{ s.nombre }}</h2>
              <span class="etiqueta">{{ estados[s.estado] }}</span>
            </div>
            <p>DNI {{ s.dni }} · {{ s.email }}</p>
            <p><strong>{{ alcances[s.alcance] }}</strong></p>
            @if (s.detalle) {
              <p>{{ s.detalle }}</p>
            }
            <p class="fecha">Recibido el {{ s.createdAt | date: 'd MMM y, HH:mm' }}</p>
            @if (s.resueltaPor) {
              <p class="fecha">
                {{ estados[s.estado] }} por {{ s.resueltaPor.nombre }} el
                {{ s.resueltaEn | date: 'd MMM y, HH:mm' }}
              </p>
            }
            @if (s.respuesta) {
              <p class="respuesta">{{ s.respuesta }}</p>
            }

            @if (s.estado === 'PENDIENTE' || s.estado === 'EN_CURSO') {
              <div class="acciones">
                @if (s.estado === 'PENDIENTE') {
                  <button type="button" class="btn btn-secundario btn-chico"
                          (click)="cambiar(s, 'EN_CURSO')">Marcar en curso</button>
                }
                <button type="button" class="btn btn-secundario btn-chico"
                        (click)="cambiar(s, 'RECHAZADA')">Rechazar</button>
                <button type="button" class="btn btn-primario btn-chico"
                        (click)="cambiar(s, 'RESUELTA')">Marcar resuelta</button>
              </div>
            }
          </article>
        }
      </div>
    }
  `,
  styleUrls: ['../../componentes/panel.css'],
  styles: `
    .lista {
      display: grid;
      gap: 16px;
    }

    .fila {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      justify-content: space-between;
      gap: 8px;
    }

    h2 {
      margin: 0;
      font-size: 20px;
    }

    .tarjeta p {
      margin: 6px 0 0;
      overflow-wrap: anywhere;
    }

    .etiqueta,
    .fecha {
      font-size: 14px;
      color: var(--color-pizarra);
    }

    .respuesta {
      padding: 10px 12px;
      border-radius: var(--radius-md);
      background: var(--color-nube);
    }

    .acciones {
      justify-content: flex-end;
      margin-top: 14px;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Bajas implements OnInit {
  private readonly api = inject(ApiService);

  readonly estados = ETIQUETA_ESTADO_BAJA;
  readonly alcances = ETIQUETA_ALCANCE_BAJA;
  readonly cargando = signal(true);
  readonly error = signal<string | null>(null);
  readonly solicitudes = signal<readonly Solicitud[]>([]);

  ngOnInit(): void {
    this.api.get<Solicitud[]>('/bajas').subscribe({
      next: (s) => {
        this.solicitudes.set(s);
        this.cargando.set(false);
      },
      error: () => {
        this.error.set('No pudimos cargar los pedidos.');
        this.cargando.set(false);
      },
    });
  }

  async cambiar(s: Solicitud, estado: 'EN_CURSO' | 'RESUELTA' | 'RECHAZADA'): Promise<void> {
    let respuesta: string | undefined = s.respuesta ?? undefined;
    if (estado !== 'EN_CURSO') {
      const texto = window.prompt(
        estado === 'RESUELTA'
          ? '¿Qué se eliminó y qué se conservó por obligación legal?'
          : '¿Por qué se rechaza? Por ejemplo, no se pudo verificar la identidad.',
        respuesta ?? '',
      );
      if (texto === null) return;
      if (texto.trim().length < 5) {
        this.error.set('Dejá escrito qué se hizo: es el registro de que el pedido se atendió.');
        return;
      }
      respuesta = texto;
    }

    this.error.set(null);
    try {
      const r = await firstValueFrom(
        this.api.patch<Solicitud>(`/bajas/${s.id}`, { estado, respuesta }),
      );
      this.solicitudes.update((l) => l.map((x) => (x.id === s.id ? r : x)));
    } catch {
      this.error.set('No pudimos actualizar el pedido.');
    }
  }
}
