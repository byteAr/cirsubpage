import type { PrismaClient } from '@prisma/client';
import { GRUPOS_AUTORIDADES, RETIRADOS } from './datos/autoridades';

/** Lo único que esta función necesita de Prisma, para poder probarla sin base. */
export type ClienteAutoridades = Pick<PrismaClient, 'autoridad'>;

export interface ResultadoAutoridades {
  readonly creadas: number;
  readonly actualizadas: number;
  readonly renombradas: readonly string[];
  readonly borradas: readonly string[];
}

/**
 * Deja las autoridades como dice `datos/autoridades.ts`.
 *
 * Cada integrante se busca primero por su nombre actual y después por los que
 * tuvo antes. Encontrarlo es lo que importa: la foto está atada a la fila, y
 * crear una nueva por un cambio en cómo se escribe el nombre la dejaría sin foto
 * y con el integrante repetido.
 *
 * Nunca toca `fotoId`. Las fotos se cargan aparte, con `cargar-fotos.ts`.
 */
export async function sembrarAutoridades(prisma: ClienteAutoridades): Promise<ResultadoAutoridades> {
  let orden = 0;
  let creadas = 0;
  let actualizadas = 0;
  const renombradas: string[] = [];

  for (const grupo of GRUPOS_AUTORIDADES) {
    for (const integrante of grupo.autoridades) {
      const datos = {
        nombre: integrante.nombre,
        rango: integrante.rango,
        cargo: integrante.cargo,
        grupo: grupo.titulo,
        orden: orden++,
      };

      let existente = await prisma.autoridad.findFirst({ where: { nombre: integrante.nombre } });
      if (!existente && integrante.antes?.length) {
        existente = await prisma.autoridad.findFirst({ where: { nombre: { in: [...integrante.antes] } } });
        if (existente) renombradas.push(`${existente.nombre} → ${integrante.nombre}`);
      }

      if (existente) {
        await prisma.autoridad.update({ where: { id: existente.id }, data: datos });
        actualizadas++;
      } else {
        await prisma.autoridad.create({ data: datos });
        creadas++;
      }
    }
  }

  const borradas: string[] = [];
  for (const nombre of RETIRADOS) {
    const { count } = await prisma.autoridad.deleteMany({ where: { nombre } });
    if (count > 0) borradas.push(nombre);
  }

  return { creadas, actualizadas, renombradas, borradas };
}
