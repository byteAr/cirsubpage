import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { ServiciosService } from '../../../../core/services/servicios.service';
import { ServiceCard } from '../../../../shared/components/service-card';

@Component({
  selector: 'app-tramites',
  standalone: true,
  imports: [ServiceCard],
  templateUrl: './tramites.html',
  styleUrl: './tramites.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Tramites {
  private readonly serviciosService = inject(ServiciosService);
  readonly tramites = this.serviciosService.getTramites();
}
