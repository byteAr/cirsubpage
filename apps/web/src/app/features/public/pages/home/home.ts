import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import type { Filial, SlideCarrusel } from '@cirsub/shared';
import { ContenidoService } from '../../../../core/servicios/contenido.service';
import { CarruselNovedades } from '../../../../shared/components/carrusel-novedades/carrusel-novedades';
import { ShowcaseCredencial } from '../../../../shared/components/showcase-credencial/showcase-credencial';
import { MapaArgentina } from '../../../../shared/components/mapa-argentina/mapa-argentina';
import { RevelarDirectiva } from '../../../../shared/directivas/revelar.directiva';
import { environment } from '../../../../../environments/environment';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    CarruselNovedades,
    ShowcaseCredencial,
    MapaArgentina,
    RevelarDirectiva,
  ],
  templateUrl: './home.html',
  styleUrl: './home.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Home implements OnInit {
  private readonly contenido = inject(ContenidoService);

  readonly slides = signal<readonly SlideCarrusel[]>([]);
  readonly filiales = signal<readonly Filial[]>([]);

  readonly urlCredencial = environment.urlCredencial;
  readonly urlGestion = environment.urlGestion;

  ngOnInit(): void {
    this.contenido.carrusel().subscribe((s) => this.slides.set(s));
    this.contenido.filiales().subscribe((f) => this.filiales.set(f));
  }
}
