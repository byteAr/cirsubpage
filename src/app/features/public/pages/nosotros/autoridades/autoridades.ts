import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { AutoridadesService } from '../../../../../core/services/autoridades.service';
import { Autoridad } from '../../../../../core/models';

/** Una persona del organigrama, con su dependencia directa si la tiene. */
export interface NodoAutoridad {
  readonly autoridad: Autoridad;
  /** Ej.: el Pro Secretario cuelga del Secretario. */
  readonly subordinados: readonly Autoridad[];
}

/** Rama del organigrama que cuelga de la Vicepresidencia. */
export interface RamaAutoridades {
  readonly titulo: string;
  readonly nodos: readonly NodoAutoridad[];
}

@Component({
  selector: 'app-autoridades',
  standalone: true,
  imports: [],
  templateUrl: './autoridades.html',
  styleUrls: ['./autoridades.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Autoridades {
  private readonly autoridadesService = inject(AutoridadesService);

  readonly presidente: Autoridad | undefined;
  readonly vicepresidente: Autoridad | undefined;
  readonly ramas: readonly RamaAutoridades[];

  /** Imagen de reemplazo si falta la foto de una autoridad. */
  readonly imagenFallback = 'images/autoridades/default.png';

  constructor() {
    const grupos = this.autoridadesService.getGrupos();
    const find = (titulo: string): readonly Autoridad[] =>
      grupos.find((g) => g.titulo === titulo)?.autoridades ?? [];

    const presidencia = find('Presidencia');
    this.presidente = presidencia[0];
    this.vicepresidente = presidencia[1];

    this.ramas = [
      // Secretaría y Tesorería tienen dos niveles: titular y "pro".
      this.ramaConSubordinado('Secretaría', find('Secretaría')),
      this.ramaConSubordinado('Tesorería', find('Tesorería')),
      this.ramaPlana('Vocales Titulares', find('Vocales Titulares')),
      this.ramaPlana('Junta Fiscalizadora', find('Junta Fiscalizadora')),
    ];
  }

  /** Rama de dos niveles: el primero es el titular, el resto depende de él. */
  private ramaConSubordinado(titulo: string, personas: readonly Autoridad[]): RamaAutoridades {
    const [titular, ...resto] = personas;
    return {
      titulo,
      nodos: titular ? [{ autoridad: titular, subordinados: resto }] : [],
    };
  }

  /** Rama de un solo nivel: todos los integrantes son pares entre sí. */
  private ramaPlana(titulo: string, personas: readonly Autoridad[]): RamaAutoridades {
    return {
      titulo,
      nodos: personas.map((autoridad) => ({ autoridad, subordinados: [] })),
    };
  }

  /** Cantidad de integrantes de la rama, contando los subordinados. */
  totalIntegrantes(rama: RamaAutoridades): number {
    return rama.nodos.reduce((acc, n) => acc + 1 + n.subordinados.length, 0);
  }

  onImageError(event: Event): void {
    const img = event.target as HTMLImageElement;
    if (!img.src.endsWith(this.imagenFallback)) {
      img.src = this.imagenFallback;
    }
  }
}
