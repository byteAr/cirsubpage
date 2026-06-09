import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { ContactosService } from '../../../../core/services/contactos.service';
import { IconIllustration } from '../../../../shared/components/icon-illustration/icon-illustration';

@Component({
  selector: 'app-contact',
  standalone: true,
  imports: [IconIllustration],
  templateUrl: './contact.html',
  styleUrl: './contact.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Contact {
  private readonly contactosService = inject(ContactosService);
  readonly departamentos = this.contactosService.getDepartamentos();
}
