// El paquete es CommonJS por defecto, así que la salida ESM necesita su propio
// package.json marcándola como módulo. Sin esto, Node trata los .js de esm/
// como CommonJS y el import falla.
import { writeFileSync } from 'node:fs';
import { join } from 'node:path';

const destino = join(import.meta.dirname, '..', 'dist', 'esm', 'package.json');
writeFileSync(destino, JSON.stringify({ type: 'module' }, null, 2) + '\n');
