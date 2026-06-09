import { Injectable } from '@angular/core';
import { GrupoAutoridades } from '../models';

/**
 * Provee los datos de las autoridades institucionales de la Mutual.
 * En el futuro puede reemplazarse por un cliente HTTP que consuma un backend.
 */
@Injectable({ providedIn: 'root' })
export class AutoridadesService {
  private readonly grupos: readonly GrupoAutoridades[] = [
    {
      titulo: 'Presidencia',
      autoridades: [
        { nombre: 'Pedro Daniel Cañete', rango: 'Suboficial Mayor (R)', cargo: 'Presidente', imagen: 'images/autoridades/daniel-cañete.jpeg' },
        { nombre: 'Teodoro Ramón Coronel', rango: 'Suboficial Mayor (R)', cargo: 'Vice Presidente', imagen: 'images/autoridades/teodoro-coronel.jpeg' },
      ],
    },
    {
      titulo: 'Secretaría',
      autoridades: [
        { nombre: 'Antonio M. Brizuela', rango: 'Suboficial Mayor (R)', cargo: 'Secretario', imagen: 'images/autoridades/antonio-brizuela.jpeg' },
        { nombre: 'Gumersindo Vazquez', rango: 'Suboficial Mayor (R)', cargo: 'Pro Secretario', imagen: 'images/autoridades/gumersindo-vazquez.jpeg' },
      ],
    },
    {
      titulo: 'Tesorería',
      autoridades: [
        { nombre: 'Hipólito Noguera', rango: 'Suboficial Mayor (R)', cargo: 'Tesorero', imagen: 'images/autoridades/hipolito-noguera.jpeg' },
        { nombre: 'Carlos González', rango: 'Suboficial Mayor (R)', cargo: 'Pro Tesorero', imagen: 'images/autoridades/carlos-gonzalez.jpeg' },
      ],
    },
    {
      titulo: 'Vocales Titulares',
      autoridades: [
        { nombre: 'Amador Polo', rango: 'Suboficial Mayor (R)', cargo: 'Vocal Titular', imagen: 'images/autoridades/amador-polo.jpeg' },
        { nombre: 'Antonio Moral', rango: 'Suboficial Mayor (R)', cargo: 'Vocal Titular', imagen: 'images/autoridades/antonio-moral.jpeg' },
        { nombre: 'Carlos Leiva', rango: 'Suboficial Mayor (R)', cargo: 'Vocal Titular', imagen: 'images/autoridades/carlos-leiva.jpeg' },
      ],
    },
    {
      titulo: 'Junta Fiscalizadora',
      autoridades: [
        { nombre: 'Julián Colman', rango: 'Suboficial Mayor (R)', cargo: 'Junta de Fiscalización', imagen: 'images/autoridades/julian-colman.jpeg' },
        { nombre: 'Óscar Mokoski', rango: 'Suboficial Mayor (R)', cargo: 'Junta de Fiscalización', imagen: 'images/autoridades/oscar-mokoski.jpeg' },
        { nombre: 'Pedro Sosa', rango: 'Suboficial Mayor (R)', cargo: 'Junta de Fiscalización', imagen: 'images/autoridades/pedro-sosa.jpeg' },
        { nombre: 'Ramón Sena', rango: 'Suboficial Mayor (R)', cargo: 'Junta de Fiscalización', imagen: 'images/autoridades/ramon-sena.jpeg' },
        { nombre: 'José Aguilera', rango: 'Suboficial Mayor (R)', cargo: 'Junta de Fiscalización', imagen: 'images/autoridades/jose-aguilera.jpeg' },
      ],
    },
  ];

  getGrupos(): readonly GrupoAutoridades[] {
    return this.grupos;
  }
}
