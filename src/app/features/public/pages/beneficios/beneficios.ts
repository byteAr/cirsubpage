import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { ServiciosService } from '../../../../core/services/servicios.service';
import { ServiceCard } from '../../../../shared/components/service-card';

@Component({
  selector: 'app-beneficios',
  standalone: true,
  imports: [ServiceCard],
  templateUrl: './beneficios.html',
  styleUrl: './beneficios.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Beneficios {
  private readonly serviciosService = inject(ServiciosService);
  readonly servicios = this.serviciosService.getServicios();
}
