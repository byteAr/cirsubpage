import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CabeceraPagina } from '../../../../shared/components/cabecera-pagina/cabecera-pagina';
import { DATOS_LEGALES } from './datos-legales';

/**
 * Política de privacidad del sitio y de la app de la credencial digital.
 *
 * Describe lo que el código hace hoy. Si la app empieza a recolectar otro dato o
 * se suma un proveedor, hay que actualizar este texto y el formulario de
 * seguridad de datos de Google Play y las etiquetas de privacidad de Apple.
 */
@Component({
  selector: 'app-privacidad',
  standalone: true,
  imports: [CabeceraPagina, RouterLink],
  templateUrl: './privacidad.html',
  styleUrl: './legal.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Privacidad {
  readonly d = DATOS_LEGALES;
}
