import { ChangeDetectionStrategy, Component } from '@angular/core';
import { CabeceraPagina } from '../../../../shared/components/cabecera-pagina/cabecera-pagina';
import { environment } from '../../../../../environments/environment';

/**
 * Los trámites del asociado ya no se explican acá: se hacen en la app del
 * Círculo, desde «Mis trámites». Lo único que queda fuera de la app es afiliarse
 * y sacar la credencial, que pasan por el WhatsApp de Afiliaciones.
 */
@Component({
  selector: 'app-tramites',
  standalone: true,
  imports: [CabeceraPagina],
  template: `
    <app-cabecera-pagina etiqueta="Trámites" titulo="Gestioná tu situación como asociado">
      <p bajada>
        Si deseás afiliarte u obtener tu credencial digital, contactate con el departamento
        de Afiliaciones a través del WhatsApp
        <a
          [href]="whatsappAfiliaciones"
          target="_blank"
          rel="noopener noreferrer"
          aria-label="11 2652-6532, abre una conversación de WhatsApp con Afiliaciones">11 2652-6532</a>.
        Si ya tenés acceso a la
        <a [href]="urlCredencial" target="_blank" rel="noopener noreferrer">app del Círculo</a>,
        podrás realizar allí todos los trámites disponibles desde «Mis trámites».
      </p>
    </app-cabecera-pagina>
  `,
  styleUrl: './tramites.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Tramites {
  /** Con el 9 de celular: sin él, WhatsApp no encuentra los números argentinos. */
  readonly whatsappAfiliaciones = 'https://wa.me/5491126526532';
  readonly urlCredencial = environment.urlCredencial;
}
