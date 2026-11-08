import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CabeceraPagina } from '../../../../shared/components/cabecera-pagina/cabecera-pagina';
import { DATOS_LEGALES } from './datos-legales';

/** Términos y condiciones del sitio y de la app de la credencial digital. */
@Component({
  selector: 'app-terminos',
  standalone: true,
  imports: [CabeceraPagina, RouterLink],
  template: `
    <app-cabecera-pagina etiqueta="Legal" titulo="Términos y condiciones"
      bajada="Las reglas para usar este sitio y la app de la Credencial Digital." />

    <article class="legal">
      @if (d.BORRADOR) {
        <p class="borrador">
          Borrador pendiente de revisión legal. Los datos entre corchetes todavía no están confirmados.
        </p>
      }

      <p>Vigente desde: {{ d.VIGENTE_DESDE }}.</p>

      <h2>1. Quiénes somos</h2>
      <p>
        Este sitio y la app de la Credencial Digital son de {{ d.RAZON_SOCIAL }} («la Mutual»),
        {{ d.CUIT }}, {{ d.MATRICULA }}, con domicilio en {{ d.DOMICILIO }}. Al usarlos, aceptás estos
        términos. Si no estás de acuerdo, no los uses.
      </p>

      <h2>2. Quién puede usar la app</h2>
      <p>
        La app es para asociados de la Mutual. El registro valida tu DNI y tu teléfono contra tu ficha,
        con un código que te enviamos. Si tus datos no coinciden, comunicate con la Mutual.
      </p>

      <h2>3. Tu cuenta</h2>
      <ul>
        <li>Es personal: no la compartas ni le pases tu contraseña o tus códigos a nadie.</li>
        <li>Los datos que cargues tienen que ser verdaderos y estar actualizados.</li>
        <li>Si creés que alguien entró a tu cuenta, avisanos enseguida.</li>
      </ul>

      <h2>4. La Credencial Digital</h2>
      <p>
        Acredita tu condición de asociado mientras la tengas vigente. Es personal e intransferible y
        la Mutual puede pedirte que además acredites tu identidad con tu documento.
      </p>

      <h2>5. Trámites, simulador y beneficios</h2>
      <ul>
        <li>Iniciar un trámite por la app no implica que esté aprobado: se evalúa según las reglas de la Mutual.</li>
        <li>El simulador de préstamos es orientativo: no es una oferta ni garantiza el otorgamiento, el monto o las condiciones.</li>
        <li>Los convenios y beneficios los da cada comercio o filial, con las condiciones publicadas, y pueden cambiar o terminar.</li>
      </ul>

      <h2>6. Uso correcto</h2>
      <p>No está permitido:</p>
      <ul>
        <li>Hacerte pasar por otra persona o presentar documentos falsos.</li>
        <li>Intentar entrar a cuentas o datos ajenos, o afectar el funcionamiento de los sistemas.</li>
        <li>Usar el chat para enviar contenido ofensivo, ilegal o ajeno a la atención de la Mutual.</li>
      </ul>
      <p>Si esto ocurre, la Mutual puede suspender el acceso a la app, sin perjuicio de otras medidas que correspondan.</p>

      <h2>7. Contenido</h2>
      <p>
        Los textos, logos e imágenes pertenecen a la Mutual o a quienes la autorizaron a usarlos. No se
        pueden reutilizar con fines comerciales sin autorización.
      </p>

      <h2>8. Disponibilidad</h2>
      <p>
        Trabajamos para que el servicio esté disponible y la información sea correcta, pero puede haber
        interrupciones por mantenimiento o causas ajenas. Ante una diferencia, prevalecen los registros
        oficiales de la Mutual. Nada de esto limita los derechos que te da la ley.
      </p>

      <h2>9. Privacidad y baja</h2>
      <p>
        Cómo tratamos tus datos está en la <a routerLink="/privacidad">política de privacidad</a>. Podés
        pedir eliminar tu cuenta desde el <a routerLink="/eliminar-datos">formulario de baja de datos</a>.
        Dar de baja la cuenta de la app no equivale a dejar de ser asociado de la Mutual.
      </p>

      <h2>10. Cambios</h2>
      <p>
        Podemos actualizar estos términos. Si el cambio es importante, lo avisaremos en la app o en el
        sitio antes de que empiece a regir.
      </p>

      <h2>11. Ley aplicable y contacto</h2>
      <p>
        Se aplica la ley de la República Argentina. Por consultas:
        <a [href]="'mailto:' + d.CORREO_PRIVACIDAD">{{ d.CORREO_PRIVACIDAD }}</a> o
        <a routerLink="/contacto">nuestros canales de contacto</a>.
      </p>
    </article>
  `,
  styleUrl: './legal.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Terminos {
  readonly d = DATOS_LEGALES;
}
