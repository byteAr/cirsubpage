import { ChangeDetectionStrategy, Component } from '@angular/core';
import { IconIllustration } from '../../../../shared/components/icon-illustration/icon-illustration';
import { IconoServicio } from '../../../../core/models';

interface PortalRecibo {
  readonly titulo: string;
  readonly descripcion: string;
  readonly url: string;
  readonly icono: IconoServicio;
}

@Component({
  selector: 'app-recibos',
  standalone: true,
  imports: [IconIllustration],
  templateUrl: './recibos.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Recibos {
  readonly portales: readonly PortalRecibo[] = [
    {
      titulo: 'Retirados y Pensionados',
      descripcion: 'Caja de Retiros, Jubilaciones y Pensiones de la Policía Federal.',
      url: 'https://micaja.crjppf.gov.ar/#/ingresar',
      icono: 'retirados',
    },
    {
      titulo: 'Personal en Actividad',
      descripcion: 'Portal SERPEGEN de Gendarmería Nacional Argentina.',
      url: 'https://serpegen.gna.gob.ar/Account/Forgot',
      icono: 'actividad',
    },
  ];
}
