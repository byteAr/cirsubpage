import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-error404',
  standalone: true,
  imports: [RouterLink],
  template: `
    <div class="pantalla">
      <div class="contenedor">
        <span class="codigo" aria-hidden="true">404</span>
        <h1>No encontramos esa página</h1>
        <p>
          Puede que haya cambiado de dirección o que el enlace esté mal escrito.
          Te dejamos por dónde seguir.
        </p>

        <div class="acciones">
          <a routerLink="/" class="boton-primario">Volver al inicio</a>
          <a routerLink="/novedades" class="boton-secundario">Ver novedades</a>
          <a routerLink="/contacto" class="boton-secundario">Contacto</a>
        </div>
      </div>
    </div>
  `,
  styles: [
    `
      .pantalla {
        display: grid;
        place-items: center;
        min-height: 68vh;
        padding-block: 80px;
        background: var(--degrade-suave);
        text-align: center;
      }

      .codigo {
        display: block;
        font-family: var(--font-display);
        font-size: clamp(90px, 18vw, 180px);
        font-weight: 600;
        line-height: 1;
        letter-spacing: -0.05em;
        background: var(--degrade-marca);
        -webkit-background-clip: text;
        background-clip: text;
        color: transparent;
      }

      h1 {
        font-size: clamp(28px, 4vw, 44px);
        margin-bottom: 14px;
      }

      p {
        margin: 0 auto 32px;
        max-width: 46ch;
        font-size: 18px;
        line-height: 1.6;
        color: var(--color-pizarra);
      }

      .acciones {
        display: flex;
        flex-wrap: wrap;
        gap: 12px;
        justify-content: center;
      }

      .boton-primario,
      .boton-secundario {
        display: inline-flex;
        padding: 15px 30px;
        border-radius: 999px;
        font-size: 16.5px;
        font-weight: 600;
        transition: transform 0.26s var(--ease-rebote), background 0.22s, color 0.22s;
      }

      .boton-primario {
        background: var(--color-azul);
        color: #ffffff;
        box-shadow: 0 10px 26px rgb(0 137 184 / 0.26);
      }

      .boton-primario:hover {
        background: var(--color-azul-hondo);
        color: #ffffff;
        transform: translateY(-3px);
      }

      .boton-secundario {
        background: #ffffff;
        color: var(--color-tinta);
        box-shadow: var(--shadow-suave);
      }

      .boton-secundario:hover {
        color: var(--color-azul);
        transform: translateY(-3px);
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Error404 {}
