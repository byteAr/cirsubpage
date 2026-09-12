import {
  Directive,
  TemplateRef,
  ViewContainerRef,
  effect,
  inject,
  input,
} from '@angular/core';
import type { Permiso } from '@cirsub/shared';
import { SesionService } from '../../core/servicios/sesion.service';

/**
 * Muestra el bloque solo si el usuario tiene alguno de los permisos.
 *
 *   <button *siPuede="'novedades.publicar'">Publicar</button>
 */
@Directive({ selector: '[siPuede]', standalone: true })
export class SiPuedeDirectiva {
  private readonly plantilla = inject(TemplateRef<unknown>);
  private readonly contenedor = inject(ViewContainerRef);
  private readonly sesion = inject(SesionService);

  readonly siPuede = input.required<Permiso | Permiso[]>();

  private visible = false;

  constructor() {
    effect(() => {
      const requeridos = this.siPuede();
      const lista = Array.isArray(requeridos) ? requeridos : [requeridos];
      // Se lee la señal para que el bloque reaccione al cambiar de usuario.
      this.sesion.usuario();
      const permitido = this.sesion.puedeAlguno(...lista);

      if (permitido && !this.visible) {
        this.contenedor.createEmbeddedView(this.plantilla);
        this.visible = true;
      } else if (!permitido && this.visible) {
        this.contenedor.clear();
        this.visible = false;
      }
    });
  }
}
