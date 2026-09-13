import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import type { PaginaInfo } from '@cirsub/shared';
import { ContenidoService } from '../../../../core/servicios/contenido.service';
import { TarjetaServicio } from '../../../../shared/components/tarjeta-servicio/tarjeta-servicio';
import { CabeceraPagina } from '../../../../shared/components/cabecera-pagina/cabecera-pagina';
import { RevelarDirectiva } from '../../../../shared/directivas/revelar.directiva';
import type { IconoServicio } from '../../../../core/models';

@Component({
  selector: 'app-beneficios',
  standalone: true,
  imports: [TarjetaServicio, RevelarDirectiva, CabeceraPagina],
  template: `
    <app-cabecera-pagina
      etiqueta="Bienestar social"
      titulo="Servicios y beneficios para el socio"
      bajada="Subsidios, asesoramiento profesional, turismo y asistencia. Todo lo que la mutual pone a disposición de sus asociados y sus familiares directos." />

    <div class="contenedor">
      <div class="grilla">
        @for (p of paginas(); track p.id; let i = $index) {
          <app-tarjeta-servicio
            [titulo]="p.titulo"
            [icono]="icono(p)"
            [ruta]="'/servicios/' + p.slug"
            [descripcion]="p.subtitulo"
            [appRevelar]="i * 60" />
        }
      </div>
    </div>
  `,
  styleUrl: './beneficios.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Beneficios implements OnInit {
  private readonly contenido = inject(ContenidoService);

  readonly paginas = signal<readonly PaginaInfo[]>([]);

  ngOnInit(): void {
    this.contenido.paginas('SERVICIO').subscribe((p) => this.paginas.set(p));
  }

  icono(pagina: PaginaInfo): IconoServicio {
    return (pagina.icono ?? 'institucional') as IconoServicio;
  }
}
