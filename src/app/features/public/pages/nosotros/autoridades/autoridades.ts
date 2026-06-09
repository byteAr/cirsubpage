import { ChangeDetectionStrategy, Component, inject, PLATFORM_ID, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { OrganizationChartModule } from 'primeng/organizationchart';
import { TreeNode } from 'primeng/api';
import { AutoridadesService } from '../../../../../core/services/autoridades.service';
import { Autoridad } from '../../../../../core/models';

@Component({
  selector: 'app-autoridades',
  standalone: true,
  imports: [OrganizationChartModule],
  templateUrl: './autoridades.html',
  styleUrls: ['./autoridades.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Autoridades {
  private readonly autoridadesService = inject(AutoridadesService);
  readonly isBrowser = signal(isPlatformBrowser(inject(PLATFORM_ID)));

  selectedNodes: TreeNode[] = [];
  readonly data: TreeNode[] = this.buildTree();

  /**
   * Arma la jerarquía institucional para el p-organization-chart.
   * Estructura: Presidente → Vice → [Secretaría, Tesorería, Vocales, Junta Fiscalizadora]
   */
  private buildTree(): TreeNode[] {
    const grupos = this.autoridadesService.getGrupos();

    const find = (titulo: string) =>
      grupos.find((g) => g.titulo === titulo)?.autoridades ?? [];

    const presidencia = find('Presidencia');
    const secretaria = find('Secretaría');
    const tesoreria = find('Tesorería');
    const vocales = find('Vocales Titulares');
    const fiscalizacion = find('Junta Fiscalizadora');

    const presidente = presidencia[0];
    const vice = presidencia[1];

    return [
      {
        ...this.personNode(presidente),
        expanded: true,
        children: [
          {
            ...this.personNode(vice),
            expanded: true,
            children: [
              this.secretariaSubtree(secretaria),
              this.tesoreriaSubtree(tesoreria),
              this.grupoSubtree('Vocales Titulares', vocales),
              this.grupoSubtree('Junta Fiscalizadora', fiscalizacion),
            ],
          },
        ],
      },
    ];
  }

  private personNode(a: Autoridad | undefined): TreeNode {
    if (!a) return { label: '—' };
    return {
      type: 'person',
      data: { nombre: a.nombre, rango: a.rango, cargo: a.cargo, imagen: a.imagen },
    };
  }

  private secretariaSubtree(personas: readonly Autoridad[]): TreeNode {
    const [secretario, proSecretario] = personas;
    return {
      ...this.personNode(secretario),
      expanded: true,
      children: proSecretario ? [this.personNode(proSecretario)] : [],
    };
  }

  private tesoreriaSubtree(personas: readonly Autoridad[]): TreeNode {
    const [tesorero, proTesorero] = personas;
    return {
      ...this.personNode(tesorero),
      expanded: true,
      children: proTesorero ? [this.personNode(proTesorero)] : [],
    };
  }

  private grupoSubtree(titulo: string, personas: readonly Autoridad[]): TreeNode {
    return {
      type: 'grupo',
      data: { titulo, cantidad: personas.length },
      expanded: true,
      children: personas.map((p) => this.personNode(p)),
    };
  }
}
