import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { PERMISOS } from '@cirsub/shared';
import { PanelService } from '../../../../core/servicios/panel.service';
import { SesionService } from '../../../../core/servicios/sesion.service';

/**
 * Listado de filiales para administradores.
 * Quien mantiene una sola filial va directo a la suya: no tiene nada que elegir.
 */
@Component({
  selector: 'app-lista-filiales',
  standalone: true,
  imports: [RouterLink],
  template: `
    <div class="encabezado">
      <div>
        <h1>Filiales</h1>
        <p>Dirección, contactos, capacidad y convenios de cada filial.</p>
      </div>
    </div>

    @if (sinFilial()) {
      <div class="aviso aviso-atencion">
        Tu usuario no tiene una filial asignada. Pedile a un administrador que te asigne una.
      </div>
    } @else if (cargando()) {
      <div class="esqueleto" style="height: 220px"></div>
    } @else {
      <section class="tarjeta">
        <ul class="lista">
          @for (f of filiales(); track f.id) {
            <li><a [routerLink]="['/admin/filiales', f.id]">{{ f.nombre }}</a></li>
          }
        </ul>
      </section>
    }
  `,
  styleUrls: ['../../componentes/panel.css'],
  styles: `
    .lista {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
      gap: 6px 20px;
      margin: 0;
      padding: 0;
      list-style: none;
    }

    .lista a {
      display: block;
      padding: 10px 0;
      font-weight: 600;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ListaFiliales implements OnInit {
  private readonly panel = inject(PanelService);
  private readonly sesion = inject(SesionService);
  private readonly router = inject(Router);

  readonly filiales = signal<readonly { id: string; nombre: string }[]>([]);
  readonly cargando = signal(true);
  readonly sinFilial = signal(false);

  ngOnInit(): void {
    if (this.sesion.alcance(PERMISOS.FILIALES_EDITAR) === 'propio') {
      const propia = this.sesion.usuario()?.filial;
      if (propia) {
        void this.router.navigate(['/admin/filiales', propia.id], { replaceUrl: true });
      } else {
        this.sinFilial.set(true);
      }
      return;
    }

    this.panel.filiales().subscribe({
      next: (f) => {
        this.filiales.set(f);
        this.cargando.set(false);
      },
      error: () => this.cargando.set(false),
    });
  }
}
