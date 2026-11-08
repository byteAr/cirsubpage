import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { ALCANCE_BAJA, ETIQUETA_ALCANCE_BAJA } from '@cirsub/shared';
import { ApiService } from '../../../../core/servicios/api.service';
import { CabeceraPagina } from '../../../../shared/components/cabecera-pagina/cabecera-pagina';
import { DATOS_LEGALES } from './datos-legales';

/**
 * Pedido de eliminación de cuenta y datos.
 *
 * Es la dirección que se declara en Google Play: tiene que funcionar sin sesión y
 * sin la app instalada, porque quien la busca puede haberla desinstalado.
 */
@Component({
  selector: 'app-eliminar-datos',
  standalone: true,
  imports: [CabeceraPagina, FormsModule, RouterLink],
  template: `
    <app-cabecera-pagina etiqueta="Legal" titulo="Eliminar tu cuenta y tus datos"
      bajada="Cómo pedir la baja de tu cuenta de la app de la Credencial Digital de la Mutual del Círculo de Suboficiales de Gendarmería Nacional." />

    <article class="legal">
      @if (d.BORRADOR) {
        <p class="borrador">
          Borrador pendiente de revisión legal. Los datos entre corchetes todavía no están confirmados.
        </p>
      }

      <h2>Qué se elimina</h2>
      <ul>
        <li>Tu acceso a la app: la cuenta, la contraseña y la foto de la credencial.</li>
        <li>Los identificadores del dispositivo para notificaciones y el registro de uso de la app.</li>
        <li>Si pedís también la baja de tus datos, los que la Mutual no esté obligada a conservar.</li>
      </ul>

      <h2>Qué se puede conservar</h2>
      <p>
        Los datos necesarios para cumplir obligaciones legales o contables, o vinculados a operaciones
        vigentes, como préstamos, ayudas o trámites en curso. Se conservan durante {{ d.CONSERVACION }},
        solo con ese fin. Te vamos a informar qué se conservó y por qué.
      </p>
      <p>
        <strong>Eliminar la cuenta de la app no te da de baja como asociado.</strong> Para desasociarte,
        <a routerLink="/contacto">comunicate con la Mutual</a>.
      </p>

      <h2>Plazo</h2>
      <p>
        Vamos a responderte dentro de los plazos que fija la Ley N° 25.326. Podemos pedirte que acredites
        tu identidad, para que nadie pida la baja en tu nombre.
      </p>

      <h2>Hacé tu pedido</h2>
      @if (enviado()) {
        <p class="exito" role="status">
          Recibimos tu pedido. Te vamos a responder a {{ email() }}. Si no te llega nada, escribinos a
          <a [href]="'mailto:' + d.CORREO_PRIVACIDAD">{{ d.CORREO_PRIVACIDAD }}</a>.
        </p>
      } @else {
        <form class="formulario" (submit)="$event.preventDefault(); enviar()">
          <label class="campo">
            Nombre y apellido
            <input type="text" name="nombre" autocomplete="name" maxlength="120" required
                   [ngModel]="nombre()" (ngModelChange)="nombre.set($event)" />
          </label>
          <label class="campo">
            DNI (solo números)
            <input type="text" name="dni" inputmode="numeric" maxlength="9" required
                   [ngModel]="dni()" (ngModelChange)="dni.set($event)" />
          </label>
          <label class="campo">
            Correo para responderte
            <input type="email" name="email" autocomplete="email" maxlength="160" required
                   [ngModel]="email()" (ngModelChange)="email.set($event)" />
          </label>
          <label class="campo">
            Qué querés eliminar
            <select name="alcance" [ngModel]="alcance()" (ngModelChange)="alcance.set($event)">
              <option [value]="alcances.CUENTA_APP">{{ etiquetas.CUENTA_APP }}</option>
              <option [value]="alcances.DATOS">{{ etiquetas.DATOS }}</option>
            </select>
          </label>
          <label class="campo">
            Aclaración (opcional)
            <textarea name="detalle" maxlength="1000" [ngModel]="detalle()"
                      (ngModelChange)="detalle.set($event)"></textarea>
          </label>
          <label class="trampa" aria-hidden="true">
            No completar
            <input type="text" name="web" tabindex="-1" autocomplete="off"
                   [ngModel]="web()" (ngModelChange)="web.set($event)" />
          </label>

          @if (error(); as e) {
            <p class="error" role="alert">{{ e }}</p>
          }

          <button type="submit" class="enviar" [disabled]="!completo() || enviando()">
            Enviar el pedido
          </button>
        </form>
        <p>
          También podés escribir a
          <a [href]="'mailto:' + d.CORREO_PRIVACIDAD">{{ d.CORREO_PRIVACIDAD }}</a>. Más información en la
          <a routerLink="/privacidad" fragment="tus-derechos">política de privacidad</a>.
        </p>
      }
    </article>
  `,
  styleUrl: './legal.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EliminarDatos {
  private readonly api = inject(ApiService);

  readonly d = DATOS_LEGALES;
  readonly alcances = ALCANCE_BAJA;
  readonly etiquetas = ETIQUETA_ALCANCE_BAJA;

  readonly nombre = signal('');
  readonly dni = signal('');
  readonly email = signal('');
  readonly alcance = signal<string>(ALCANCE_BAJA.CUENTA_APP);
  readonly detalle = signal('');
  readonly web = signal('');
  readonly enviando = signal(false);
  readonly enviado = signal(false);
  readonly error = signal<string | null>(null);

  readonly completo = computed(
    () =>
      this.nombre().trim().length >= 2 &&
      /^\d{7,9}$/.test(this.dni().trim()) &&
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(this.email().trim()),
  );

  async enviar(): Promise<void> {
    if (!this.completo() || this.enviando()) return;

    this.enviando.set(true);
    this.error.set(null);
    try {
      await firstValueFrom(
        this.api.post('/publico/solicitud-baja', {
          nombre: this.nombre().trim(),
          dni: this.dni().trim(),
          email: this.email().trim(),
          alcance: this.alcance(),
          detalle: this.detalle().trim() || undefined,
          web: this.web() || undefined,
        }),
      );
      this.enviado.set(true);
    } catch (e) {
      const m = (e as { error?: { message?: string | string[] } }).error?.message;
      this.error.set(
        Array.isArray(m) ? m.join(' ') : (m ?? 'No pudimos enviar el pedido. Probá de nuevo o escribinos por correo.'),
      );
    } finally {
      this.enviando.set(false);
    }
  }
}
