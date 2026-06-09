/**
 * Representa una autoridad institucional (presidente, vocal, secretario, etc.)
 */
export interface Autoridad {
  readonly nombre: string;
  readonly rango: string;
  readonly cargo: string;
  readonly imagen: string;
}

/** Agrupación de autoridades por categoría (Presidencia, Secretaría, Tesorería, etc.) */
export interface GrupoAutoridades {
  readonly titulo: string;
  readonly autoridades: readonly Autoridad[];
}
