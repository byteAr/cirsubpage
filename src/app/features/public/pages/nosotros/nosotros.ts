import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ServiceCard } from '../../../../shared/components/service-card';

@Component({
  selector: 'app-nosotros',
  standalone: true,
  imports: [ServiceCard],
  templateUrl: './nosotros.html',
  styleUrl: './nosotros.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Nosotros {
  readonly secciones = [
    {
      titulo: 'Institucional',
      icono: 'institucional' as const,
      ruta: '/nosotros/institucional',
      descripcion: 'Constitución, finalidades y misión de la mutual.',
    },
    {
      titulo: 'Autoridades',
      icono: 'autoridades' as const,
      ruta: '/nosotros/autoridades',
      descripcion: 'Conocé a quienes conducen la institución.',
    },
  ];
}
