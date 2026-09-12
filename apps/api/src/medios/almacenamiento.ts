import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createReadStream } from 'node:fs';
import { mkdir, rm, writeFile } from 'node:fs/promises';
import { dirname, join, normalize, resolve, sep } from 'node:path';
import type { Configuracion } from '../config/configuracion';

/**
 * Contrato de almacenamiento.
 *
 * Hoy escribe en el disco del servidor. Cuando los archivos se muden al NAS
 * alcanza con montar la unidad en la misma ruta, o escribir otra implementación
 * de esta interfaz. La base guarda siempre claves relativas, así que no cambia.
 */
export abstract class Almacenamiento {
  abstract guardar(clave: string, contenido: Buffer): Promise<void>;
  abstract eliminar(clave: string): Promise<void>;
  abstract leer(clave: string): NodeJS.ReadableStream;
  abstract rutaAbsoluta(clave: string): string;
}

@Injectable()
export class AlmacenamientoDisco extends Almacenamiento {
  private readonly log = new Logger(AlmacenamientoDisco.name);
  private readonly raiz: string;

  constructor(config: ConfigService<Configuracion, true>) {
    super();
    this.raiz = resolve(config.get('almacenamiento', { infer: true }).raiz);
  }

  /**
   * Impide que una clave con `..` se escape del directorio de medios.
   * Las claves las genera la API, pero esto cubre el día que alguien pase una
   * clave venida de la base o de un parámetro.
   */
  rutaAbsoluta(clave: string): string {
    const limpia = normalize(clave).replace(/^([/\\])+/, '');
    const destino = resolve(join(this.raiz, limpia));
    if (destino !== this.raiz && !destino.startsWith(this.raiz + sep)) {
      throw new Error(`Clave de almacenamiento fuera de rango: ${clave}`);
    }
    return destino;
  }

  async guardar(clave: string, contenido: Buffer): Promise<void> {
    const destino = this.rutaAbsoluta(clave);
    await mkdir(dirname(destino), { recursive: true });
    await writeFile(destino, contenido);
  }

  async eliminar(clave: string): Promise<void> {
    try {
      await rm(this.rutaAbsoluta(clave), { force: true });
    } catch (error) {
      this.log.warn(`No se pudo borrar ${clave}: ${(error as Error).message}`);
    }
  }

  leer(clave: string): NodeJS.ReadableStream {
    return createReadStream(this.rutaAbsoluta(clave));
  }
}
