/* eslint-disable no-console */
/**
 * Carga las fotos de filiales y autoridades en la biblioteca de medios y las
 * asocia a cada registro.
 *
 * Se corre una vez, después de la semilla. Es idempotente: si el archivo ya
 * está cargado, reutiliza el medio existente en lugar de duplicarlo.
 *
 *   npx ts-node --compiler-options {"module":"CommonJS"} prisma/cargar-fotos.ts
 */
import { PrismaClient } from '@prisma/client';
import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { randomUUID } from 'node:crypto';
import { dirname, extname, join, resolve } from 'node:path';
import sharp from 'sharp';

const prisma = new PrismaClient();

const RAIZ_PUBLICA = resolve(__dirname, '../../web/public');
const RAIZ_ALMACEN = resolve(__dirname, '..', process.env['STORAGE_RAIZ'] ?? './storage');

/** Las mismas variantes que genera la subida desde el panel. */
const VARIANTES = [
  { nombre: 'slide-2x', ancho: 1600, alto: 1200, recortar: true },
  { nombre: 'slide', ancho: 1024, alto: 768, recortar: true },
  { nombre: 'slide-sm', ancho: 640, alto: 480, recortar: true },
  { nombre: 'portada', ancho: 1600, alto: null, recortar: false },
  { nombre: 'contenido', ancho: 1024, alto: null, recortar: false },
  { nombre: 'miniatura', ancho: 320, alto: 240, recortar: true },
] as const;

const MIMES: Record<string, string> = {
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.webp': 'image/webp',
};

async function guardar(clave: string, contenido: Buffer): Promise<void> {
  const destino = join(RAIZ_ALMACEN, clave);
  await mkdir(dirname(destino), { recursive: true });
  await writeFile(destino, contenido);
}

async function subir(rutaRelativa: string, alt: string): Promise<string> {
  const ruta = join(RAIZ_PUBLICA, rutaRelativa);
  if (!existsSync(ruta)) throw new Error(`No existe ${rutaRelativa}`);

  const nombreOriginal = rutaRelativa.split('/').pop()!;

  // Si ya se cargó este archivo antes, se reutiliza.
  const previo = await prisma.medio.findFirst({ where: { nombreOriginal } });
  if (previo) return previo.id;

  const buffer = await readFile(ruta);
  const extension = extname(nombreOriginal).toLowerCase();
  const mime = MIMES[extension] ?? 'image/jpeg';

  const id = randomUUID();
  const hoy = new Date();
  const carpeta = `${hoy.getFullYear()}/${String(hoy.getMonth() + 1).padStart(2, '0')}`;
  const claveOriginal = `${carpeta}/${id}${extension}`;
  await guardar(claveOriginal, buffer);

  const meta = await sharp(buffer).metadata();
  const variantes: {
    variante: string;
    storageKey: string;
    ancho: number;
    alto: number;
    formato: string;
    bytes: number;
  }[] = [];

  for (const v of VARIANTES) {
    if (meta.width && v.ancho > meta.width) continue;

    for (const formato of ['avif', 'webp'] as const) {
      const pipeline = sharp(buffer).resize({
        width: v.ancho,
        height: v.alto ?? undefined,
        fit: v.recortar ? 'cover' : 'inside',
        position: 'attention',
        withoutEnlargement: !v.recortar,
      });

      const salida =
        formato === 'avif'
          ? await pipeline.avif({ quality: 55 }).toBuffer({ resolveWithObject: true })
          : await pipeline.webp({ quality: 78 }).toBuffer({ resolveWithObject: true });

      const clave = `${carpeta}/${id}-${v.nombre}.${formato}`;
      await guardar(clave, salida.data);
      variantes.push({
        variante: v.nombre,
        storageKey: clave,
        ancho: salida.info.width,
        alto: salida.info.height,
        formato,
        bytes: salida.info.size,
      });
    }
  }

  const medio = await prisma.medio.create({
    data: {
      storageKey: claveOriginal,
      nombreOriginal,
      mime,
      bytes: buffer.byteLength,
      ancho: meta.width ?? null,
      alto: meta.height ?? null,
      alt,
      variantes: { createMany: { data: variantes } },
    },
  });

  return medio.id;
}

/**
 * Las fotos de filiales están numeradas del 1 al 20 en el mismo orden en que
 * se cargaron las filiales, que es el del archivo original del sitio.
 */
async function cargarFiliales(): Promise<void> {
  const filiales = await prisma.filial.findMany({ orderBy: { orden: 'asc' } });
  let cargadas = 0;

  for (const [i, filial] of filiales.entries()) {
    if (filial.fotoId) continue;
    try {
      const fotoId = await subir(`filiales/${i + 1}.jpg`, `Sede de ${filial.nombre}`);
      await prisma.filial.update({ where: { id: filial.id }, data: { fotoId } });
      cargadas++;
    } catch (error) {
      console.log(`  sin foto: ${filial.nombre} (${(error as Error).message})`);
    }
  }

  console.log(`  filiales con foto: ${cargadas} de ${filiales.length}`);
}

/**
 * Nombres de archivo posibles para un integrante, en orden de probabilidad.
 *
 * Los archivos usan nombre y apellido sin tildes, pero no siempre el primer
 * nombre: «Pedro Daniel Cañete» está guardado como `daniel-cañete`. Por eso se
 * prueban las dos combinaciones.
 */
function nombresArchivo(nombre: string): string[] {
  const partes = nombre
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-̂̄-ͯ]/g, '') // saca las tildes y deja la eñe
    // Hay que recomponer: la eñe quedó partida en dos puntos de código y así
    // no coincide con el nombre del archivo, que la tiene entera.
    .normalize('NFC')
    .replace(/\./g, '')
    .split(/\s+/)
    .filter((p) => p.length > 1);

  if (partes.length <= 2) return [partes.join('-')];

  const apellido = partes[partes.length - 1]!;
  const candidatos = [`${partes[0]}-${apellido}`, `${partes[1]}-${apellido}`];
  return [...new Set(candidatos)];
}

async function cargarAutoridades(): Promise<void> {
  const autoridades = await prisma.autoridad.findMany({ orderBy: { orden: 'asc' } });
  let cargadas = 0;

  for (const autoridad of autoridades) {
    if (autoridad.fotoId) continue;

    const bases = nombresArchivo(autoridad.nombre);
    let fotoId: string | null = null;

    for (const base of bases) {
      for (const extension of ['.jpeg', '.jpg', '.png']) {
        try {
          fotoId = await subir(`images/autoridades/${base}${extension}`, autoridad.nombre);
          break;
        } catch {
          // Se prueba la siguiente combinación.
        }
      }
      if (fotoId) break;
    }

    if (!fotoId) {
      console.log(`  sin foto: ${autoridad.nombre} (buscaba ${bases.join(', ')})`);
      continue;
    }

    await prisma.autoridad.update({ where: { id: autoridad.id }, data: { fotoId } });
    cargadas++;
  }

  console.log(`  autoridades con foto: ${cargadas} de ${autoridades.length}`);
}

async function main(): Promise<void> {
  console.log('Cargando fotos de filiales y autoridades');
  await cargarFiliales();
  await cargarAutoridades();
  console.log('Listo');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => void prisma.$disconnect());
