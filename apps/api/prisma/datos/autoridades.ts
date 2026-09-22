/**
 * Consejo Directivo y Junta Fiscalizadora.
 *
 * La semilla busca a cada integrante por su nombre actual y, si no lo encuentra,
 * por los nombres con que figuró antes (`antes`). Así un cambio en cómo se
 * escribe un nombre actualiza la fila que ya existe —con su foto— en lugar de
 * crear una nueva sin foto y dejar la vieja al lado.
 *
 * Quien deja el Consejo va en `RETIRADOS` y la semilla lo borra. Se hace por
 * nombre explícito y no borrando «todo lo que no esté en esta lista», para que
 * nada creado por otro camino desaparezca sin que nadie lo haya pedido.
 *
 * Composición vigente desde septiembre de 2026.
 */

export interface IntegranteSemilla {
  readonly nombre: string;
  readonly rango: string;
  readonly cargo: string;
  /** Nombres con que figuró antes, para encontrar su fila y conservar la foto. */
  readonly antes?: readonly string[];
}

export interface GrupoSemilla {
  readonly titulo: string;
  readonly autoridades: readonly IntegranteSemilla[];
}

export const GRUPOS_AUTORIDADES: readonly GrupoSemilla[] = [
  {
    // Presidente y vice van arriba, fuera de las ramas del organigrama.
    titulo: 'Presidencia',
    autoridades: [
      { nombre: 'Pedro Daniel Cañete', rango: 'Suboficial Mayor (R)', cargo: 'Presidente' },
      { nombre: 'Teodoro Ramón Coronel', rango: 'Suboficial Mayor (R)', cargo: 'Vice Presidente' },
    ],
  },
  {
    titulo: 'Secretaría',
    autoridades: [
      { nombre: 'Antonio M. Brizuela', rango: 'Suboficial Mayor (R)', cargo: 'Secretario' },
      { nombre: 'Gumersindo Vazquez', rango: 'Suboficial Mayor (R)', cargo: 'Pro Secretario' },
    ],
  },
  {
    titulo: 'Tesorería',
    autoridades: [
      { nombre: 'Antonio Moral', rango: 'Suboficial Mayor (R)', cargo: 'Tesorero' },
      {
        nombre: 'Carlos Gonzalez',
        rango: 'Suboficial Mayor',
        cargo: 'Pro Tesorero',
        antes: ['Carlos González'],
      },
    ],
  },
  {
    titulo: 'Vocales',
    autoridades: [
      {
        nombre: 'Ramón Oscar Sena',
        rango: 'Suboficial Mayor',
        cargo: '1° Vocal',
        antes: ['Ramón Sena'],
      },
      {
        nombre: 'Hipólito A. Noguera',
        rango: 'Suboficial Mayor (R)',
        cargo: '2° Vocal',
        antes: ['Hipólito Noguera'],
      },
      { nombre: 'José Aguilera', rango: 'Sargento Primero', cargo: '3° Vocal' },
    ],
  },
  {
    titulo: 'Junta Fiscalizadora',
    autoridades: [
      {
        nombre: 'Reynerio Amador Polo',
        rango: 'Suboficial Mayor (R)',
        cargo: 'Presidente',
        antes: ['Amador Polo'],
      },
      {
        nombre: 'Julian Hugo Colman',
        rango: 'Suboficial Principal (R)',
        cargo: 'Secretario',
        antes: ['Julián Colman'],
      },
      { nombre: 'Carlos Leiva', rango: 'Suboficial Mayor', cargo: 'Vocal 1°' },
      {
        nombre: 'Oscar Mokoski',
        rango: 'Cabo Primero',
        cargo: 'Vocal 2°',
        antes: ['Óscar Mokoski'],
      },
    ],
  },
];

/** Dejaron de integrar el Consejo o la Junta. La semilla los borra. */
export const RETIRADOS: readonly string[] = ['Pedro Sosa'];
