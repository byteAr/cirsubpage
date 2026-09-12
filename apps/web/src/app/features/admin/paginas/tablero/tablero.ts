import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ETIQUETA_ESTADO, PERMISOS, type EstadoNovedad } from '@cirsub/shared';
import { ApiService } from '../../../../core/servicios/api.service';
import { SesionService } from '../../../../core/servicios/sesion.service';

interface ResumenTablero {
  metricas: {
    publicadas: number;
    borradores: number;
    enRevision: number;
    cambiosPedidos: number;
    medios: number;
    usuarios: number;
  };
  ultimas: {
    id: string;
    titulo: string;
    estado: EstadoNovedad;
    updatedAt: string;
    autor: { nombre: string } | null;
    filial: { nombre: string } | null;
  }[];
  actividad: {
    id: string;
    resumen: string;
    createdAt: string;
    nivel: string;
    usuario: { nombre: string } | null;
  }[];
}

@Component({
  selector: 'app-tablero',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './tablero.html',
  styleUrls: ['../../componentes/panel.css', './tablero.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Tablero implements OnInit {
  private readonly api = inject(ApiService);
  readonly sesion = inject(SesionService);

  readonly datos = signal<ResumenTablero | null>(null);
  readonly cargando = signal(true);

  readonly permisos = PERMISOS;
  readonly etiquetas = ETIQUETA_ESTADO;

  ngOnInit(): void {
    this.api.get<ResumenTablero>('/tablero').subscribe({
      next: (d) => {
        this.datos.set(d);
        this.cargando.set(false);
      },
      error: () => this.cargando.set(false),
    });
  }

  puedeRevisar(): boolean {
    return this.sesion.puede(PERMISOS.NOVEDADES_REVISAR);
  }

  puedeCrear(): boolean {
    return this.sesion.puede(PERMISOS.NOVEDADES_CREAR);
  }
}
