import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TarjetaServicio } from '../../../../shared/components/tarjeta-servicio/tarjeta-servicio';
import { RevelarDirectiva } from '../../../../shared/directivas/revelar.directiva';
import type { IconoServicio } from '../../../../core/models';

interface Seccion {
  readonly titulo: string;
  readonly descripcion: string;
  readonly icono: IconoServicio;
  readonly ruta: string;
}

@Component({
  selector: 'app-nosotros',
  standalone: true,
  imports: [RouterLink, TarjetaServicio, RevelarDirectiva],
  templateUrl: './nosotros.html',
  styleUrl: './nosotros.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Nosotros {
  readonly secciones: readonly Seccion[] = [
    {
      titulo: 'Institucional',
      descripcion: 'Cómo se constituyó la mutual y cuáles son sus finalidades estatutarias.',
      icono: 'institucional',
      ruta: '/nosotros/institucional',
    },
    {
      titulo: 'Autoridades',
      descripcion: 'El Honorable Consejo Directivo y la Junta de Fiscalización.',
      icono: 'autoridades',
      ruta: '/nosotros/autoridades',
    },
    {
      titulo: 'Filiales',
      descripcion: 'Las veinte sedes desplegadas en todo el país, con sus datos de contacto.',
      icono: 'hotel',
      ruta: '/filiales',
    },
  ];
}
