import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import type { Autoridad } from '@cirsub/shared';
import { ContenidoService } from '../../../../../core/servicios/contenido.service';
import { RevelarDirectiva } from '../../../../../shared/directivas/revelar.directiva';
import { CabeceraPagina } from '../../../../../shared/components/cabecera-pagina/cabecera-pagina';

interface Rama {
  readonly titulo: string;
  readonly integrantes: readonly Autoridad[];
}

/**
 * Organigrama del Consejo Directivo.
 *
 * La jerarquía es: Presidente, Vicepresidente y cuatro ramas. En pantallas
 * chicas los conectores desaparecen y las ramas se apilan; dibujar líneas en
 * una columna no aporta nada y ensucia.
 */
/** El grupo de la cúpula, tal como lo carga la semilla. */
const GRUPO_PRESIDENCIA = 'presidencia';

@Component({
  selector: 'app-autoridades',
  standalone: true,
  imports: [CommonModule, RevelarDirectiva, CabeceraPagina],
  templateUrl: './autoridades.html',
  styleUrl: './autoridades.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Autoridades implements OnInit {
  private readonly contenido = inject(ContenidoService);

  readonly todas = signal<readonly Autoridad[]>([]);

  /*
    La cúpula se busca sólo dentro de Presidencia.

    La Junta Fiscalizadora también tiene su Presidente. Buscando en todas, el
    primero con ese cargo salía arriba del organigrama sólo porque venía antes en
    el orden: bastaba reordenar para que el presidente de la Junta pasara a
    encabezar el Consejo.
  */
  private readonly presidencia = computed(() =>
    this.todas().filter((a) => a.grupo.toLowerCase() === GRUPO_PRESIDENCIA),
  );

  readonly presidente = computed(() => this.presidencia().find((a) => !this.esVice(a)));

  readonly vicepresidente = computed(() => this.presidencia().find((a) => this.esVice(a)));

  readonly ramas = computed<Rama[]>(() => {
    const cupula = new Set([this.presidente()?.id, this.vicepresidente()?.id]);
    const grupos = new Map<string, Autoridad[]>();

    for (const a of this.todas()) {
      if (cupula.has(a.id)) continue;
      const actual = grupos.get(a.grupo) ?? [];
      actual.push(a);
      grupos.set(a.grupo, actual);
    }

    return [...grupos.entries()].map(([titulo, integrantes]) => ({ titulo, integrantes }));
  });

  ngOnInit(): void {
    this.contenido.autoridades().subscribe((a) => this.todas.set(a));
  }

  /** Si falta la foto se muestra un círculo con las iniciales. */
  iniciales(nombre: string): string {
    return nombre
      .split(' ')
      .filter((p) => p.length > 2)
      .slice(0, 2)
      .map((p) => p[0]?.toUpperCase() ?? '')
      .join('');
  }

  private esVice(a: Autoridad): boolean {
    const cargo = a.cargo.toLowerCase();
    return cargo.includes('vice') || cargo.includes('vicepresidente');
  }
}
