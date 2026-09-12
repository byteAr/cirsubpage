import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { RevelarDirectiva } from '../../../../../shared/directivas/revelar.directiva';

@Component({
  selector: 'app-institucional',
  standalone: true,
  imports: [RouterLink, RevelarDirectiva],
  templateUrl: './institucional.html',
  styleUrl: './institucional.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Institucional {
  readonly finalidades: readonly string[] = [
    'Agrupar a quienes reúnan las condiciones que el Estatuto y su reglamentación determinan, en una asociación tendiente a acrecentar el nivel social, cultural, material, profesional y deportivo de sus asociados, consolidando la camaradería y estimulando el espíritu de cuerpo.',
    'Promover asistencia farmacéutica.',
    'Crear servicios de proveeduría, seguros generales, turismo, sepelios y panteones.',
    'Otorgar subsidios por nacimiento, adopción o reconocimiento, casamiento y fallecimiento.',
    'Prestar asistencia jurídica y ayudas económicas mutuales.',
    'Otorgar asistencia financiera, concediendo préstamos, anticipos y otras ayudas económicas, incluso las no reintegrables cuando resulten debidamente justificadas.',
  ];
}
