import { ChangeDetectionStrategy, Component } from '@angular/core';
import { IconIllustration } from '../../../../shared/components/icon-illustration/icon-illustration';
import { RevelarDirectiva } from '../../../../shared/directivas/revelar.directiva';
import type { IconoServicio } from '../../../../core/models';

interface Portal {
  readonly titulo: string;
  readonly descripcion: string;
  readonly organismo: string;
  readonly url: string;
  readonly icono: IconoServicio;
}

@Component({
  selector: 'app-recibos',
  standalone: true,
  imports: [IconIllustration, RevelarDirectiva],
  templateUrl: './recibos.html',
  styleUrl: './recibos.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Recibos {
  readonly portales: readonly Portal[] = [
    {
      titulo: 'Retirados y pensionados',
      descripcion: 'Consultá y descargá tu recibo de haberes mensual.',
      organismo: 'Caja de Retiros, Jubilaciones y Pensiones de la Policía Federal',
      url: 'https://micaja.crjppf.gov.ar/#/ingresar',
      icono: 'retirados',
    },
    {
      titulo: 'Personal en actividad',
      descripcion: 'Acceso al sistema de recibos de Gendarmería Nacional.',
      organismo: 'Portal SERPEGEN · Gendarmería Nacional Argentina',
      url: 'https://serpegen.gna.gob.ar/Account/Forgot',
      icono: 'actividad',
    },
  ];
}
