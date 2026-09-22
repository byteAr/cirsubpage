/**
 * Prueba de la semilla de autoridades contra una base en memoria que reproduce
 * lo que hay cargado hoy: las catorce filas viejas, cada una con su foto.
 *
 *   npx ts-node --compiler-options '{"module":"CommonJS"}' prisma/sembrar-autoridades.prueba.ts
 */
import { strict as assert } from 'node:assert';
import { sembrarAutoridades, type ClienteAutoridades } from './sembrar-autoridades';

interface Fila {
  id: string;
  nombre: string;
  rango: string;
  cargo: string;
  grupo: string;
  orden: number;
  fotoId: string | null;
}

/** Las catorce filas de antes, con la foto que cada una ya tenía. */
const ANTES: Omit<Fila, 'id'>[] = [
  ['Pedro Daniel Cañete', 'Presidencia'],
  ['Teodoro Ramón Coronel', 'Presidencia'],
  ['Antonio M. Brizuela', 'Secretaría'],
  ['Gumersindo Vazquez', 'Secretaría'],
  ['Hipólito Noguera', 'Tesorería'],
  ['Carlos González', 'Tesorería'],
  ['Amador Polo', 'Vocales Titulares'],
  ['Antonio Moral', 'Vocales Titulares'],
  ['Carlos Leiva', 'Vocales Titulares'],
  ['Julián Colman', 'Junta Fiscalizadora'],
  ['Óscar Mokoski', 'Junta Fiscalizadora'],
  ['Pedro Sosa', 'Junta Fiscalizadora'],
  ['Ramón Sena', 'Junta Fiscalizadora'],
  ['José Aguilera', 'Junta Fiscalizadora'],
].map(([nombre, grupo], i) => ({
  nombre,
  grupo,
  rango: 'Suboficial Mayor (R)',
  cargo: 'viejo',
  orden: i,
  fotoId: `foto-de-${nombre}`,
}));

function baseEnMemoria(inicial: Omit<Fila, 'id'>[]) {
  const filas: Fila[] = inicial.map((f, i) => ({ ...f, id: `id-${i}` }));
  let siguiente = filas.length;

  type Donde = { nombre?: string | { in: string[] }; id?: string };
  const coincide = (f: Fila, where: Donde) => {
    if (where.id !== undefined) return f.id === where.id;
    if (typeof where.nombre === 'string') return f.nombre === where.nombre;
    if (where.nombre && 'in' in where.nombre) return where.nombre.in.includes(f.nombre);
    return false;
  };

  const cliente = {
    autoridad: {
      findFirst: async ({ where }: { where: Donde }) => filas.find((f) => coincide(f, where)) ?? null,
      update: async ({ where, data }: { where: Donde; data: Partial<Fila> }) => {
        const f = filas.find((x) => coincide(x, where));
        if (!f) throw new Error('update sin fila');
        Object.assign(f, data);
        return f;
      },
      create: async ({ data }: { data: Omit<Fila, 'id' | 'fotoId'> }) => {
        const f = { ...data, id: `id-${siguiente++}`, fotoId: null };
        filas.push(f);
        return f;
      },
      deleteMany: async ({ where }: { where: Donde }) => {
        const antes = filas.length;
        for (let i = filas.length - 1; i >= 0; i--) if (coincide(filas[i], where)) filas.splice(i, 1);
        return { count: antes - filas.length };
      },
    },
  } as unknown as ClienteAutoridades;

  return { cliente, filas };
}

async function probar(): Promise<void> {
  const { cliente, filas } = baseEnMemoria(ANTES);
  const r = await sembrarAutoridades(cliente);

  console.log('resultado:', JSON.stringify(r, null, 2));

  // Trece integrantes, ninguno nuevo: todos existían, algunos con otro nombre.
  assert.equal(filas.length, 13, 'tienen que quedar trece');
  assert.equal(r.creadas, 0, 'nadie debería crearse de cero');
  assert.equal(r.actualizadas, 13);
  assert.deepEqual(r.borradas, ['Pedro Sosa']);
  assert.ok(!filas.some((f) => f.nombre === 'Pedro Sosa'), 'Pedro Sosa tiene que salir');

  // Nadie pierde la foto, y cada foto sigue siendo de la misma persona.
  for (const f of filas) assert.ok(f.fotoId, `${f.nombre} se quedó sin foto`);
  const fotoDe = (nombre: string) => filas.find((f) => f.nombre === nombre)?.fotoId;
  assert.equal(fotoDe('Reynerio Amador Polo'), 'foto-de-Amador Polo');
  assert.equal(fotoDe('Julian Hugo Colman'), 'foto-de-Julián Colman');
  assert.equal(fotoDe('Hipólito A. Noguera'), 'foto-de-Hipólito Noguera');
  assert.equal(fotoDe('Carlos Gonzalez'), 'foto-de-Carlos González');
  assert.equal(fotoDe('Oscar Mokoski'), 'foto-de-Óscar Mokoski');
  assert.equal(fotoDe('Ramón Oscar Sena'), 'foto-de-Ramón Sena');

  // Sin duplicados por nombre.
  assert.equal(new Set(filas.map((f) => f.nombre)).size, filas.length, 'hay nombres repetidos');

  // Los cambios de cargo y de grupo.
  const de = (nombre: string) => filas.find((f) => f.nombre === nombre)!;
  assert.equal(de('Antonio Moral').cargo, 'Tesorero');
  assert.equal(de('Antonio Moral').grupo, 'Tesorería');
  assert.equal(de('Hipólito A. Noguera').grupo, 'Vocales');
  assert.equal(de('Reynerio Amador Polo').grupo, 'Junta Fiscalizadora');
  assert.equal(de('Reynerio Amador Polo').cargo, 'Presidente');
  assert.equal(de('José Aguilera').rango, 'Sargento Primero');
  assert.equal(de('Oscar Mokoski').rango, 'Cabo Primero');

  // Correr la semilla dos veces no cambia nada.
  const segunda = await sembrarAutoridades(cliente);
  assert.equal(filas.length, 13);
  assert.equal(segunda.creadas, 0);
  assert.equal(segunda.renombradas.length, 0, 'la segunda vez no hay nada que renombrar');
  assert.equal(segunda.borradas.length, 0);

  console.log('\nquedan así:');
  for (const f of [...filas].sort((a, b) => a.orden - b.orden)) {
    console.log(`  ${f.grupo.padEnd(20)} ${f.cargo.padEnd(16)} ${f.nombre.padEnd(24)} ${f.rango.padEnd(26)} ${f.fotoId}`);
  }
  console.log('\ntodas las comprobaciones pasaron');
}

probar().catch((e) => {
  console.error(e);
  process.exit(1);
});
