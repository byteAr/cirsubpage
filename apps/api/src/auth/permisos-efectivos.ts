import type { Alcance, Permiso } from '@cirsub/shared';

interface PermisoFila {
  permiso: { slug: string };
  alcance: 'TODOS' | 'PROPIO';
}

interface UsuarioConPermisos {
  rol: { permisos: PermisoFila[] };
  permisos: (PermisoFila & { concedido: boolean })[];
}

const aAlcance = (a: 'TODOS' | 'PROPIO'): Alcance => (a === 'TODOS' ? 'todos' : 'propio');

/**
 * Combina los permisos del rol con las excepciones del usuario.
 *
 * Una excepción con `concedido = false` quita un permiso heredado del rol;
 * con `concedido = true` lo agrega o le cambia el alcance.
 */
export function permisosEfectivos(
  usuario: UsuarioConPermisos,
): { permiso: Permiso; alcance: Alcance }[] {
  const mapa = new Map<string, Alcance>();

  for (const fila of usuario.rol.permisos) {
    mapa.set(fila.permiso.slug, aAlcance(fila.alcance));
  }

  for (const fila of usuario.permisos) {
    if (fila.concedido) {
      mapa.set(fila.permiso.slug, aAlcance(fila.alcance));
    } else {
      mapa.delete(fila.permiso.slug);
    }
  }

  return [...mapa.entries()].map(([permiso, alcance]) => ({
    permiso: permiso as Permiso,
    alcance,
  }));
}
