import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import type { PaginaInfo } from '@cirsub/shared';
import { ContenidoService } from '../../../../core/servicios/contenido.service';
import { TarjetaServicio } from '../../../../shared/components/tarjeta-servicio/tarjeta-servicio';
import { CabeceraPagina } from '../../../../shared/components/cabecera-pagina/cabecera-pagina';
import { RevelarDirectiva } from '../../../../shared/directivas/revelar.directiva';
import type { IconoServicio } from '../../../../core/models';

@Component({
  selector: 'app-tramites',
  standalone: true,
  imports: [TarjetaServicio, RevelarDirectiva, CabeceraPagina],
  template: `
    <app-cabecera-pagina
      etiqueta="Trámites"
      titulo="Gestioná tu situación como asociado"
      bajada="Afiliarte, mantener tus datos al día o sumar a un familiar directo. Cada trámite tiene sus requisitos y su contacto." />

    <div class="contenedor">
      <div class="grilla">
        @for (p of paginas(); track p.id; let i = $index) {
          <app-tarjeta-servicio
            [titulo]="p.titulo"
            [icono]="icono(p)"
            [ruta]="'/tramites/' + p.slug"
            [descripcion]="p.subtitulo"
            [appRevelar]="i * 70" />
        }
      </div>
    </div>
  `,
  styleUrl: './tramites.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Tramites implements OnInit {
  private readonly contenido = inject(ContenidoService);

  readonly paginas = signal<readonly PaginaInfo[]>([]);

  ngOnInit(): void {
    this.contenido.paginas('TRAMITE').subscribe((p) => this.paginas.set(p));
  }

  icono(pagina: PaginaInfo): IconoServicio {
    return (pagina.icono ?? 'afiliacion') as IconoServicio;
  }
}
