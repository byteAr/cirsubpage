import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Observable, map } from 'rxjs';
import type { Configuracion } from '../config/configuracion';

/**
 * Agrega la dirección pública a cualquier archivo que viaje en una respuesta.
 *
 * En la base solo se guarda la clave relativa, nunca una URL completa: eso es
 * lo que permite mudar los archivos a otro almacenamiento sin tocar datos. La
 * contrapartida es que la dirección hay que armarla al responder, y hacerlo a
 * mano en cada consulta es olvidarse en la mitad de los casos.
 *
 * Este interceptor recorre la respuesta y, a todo objeto que tenga
 * `storageKey`, le suma `url`. También arma `variantes` con sus direcciones.
 */
@Injectable()
export class UrlMediosInterceptor implements NestInterceptor {
  constructor(private readonly config: ConfigService<Configuracion, true>) {}

  intercept(_contexto: ExecutionContext, siguiente: CallHandler): Observable<unknown> {
    const base = this.config.get('app', { infer: true }).urlMedios.replace(/\/$/, '');
    return siguiente.handle().pipe(map((cuerpo) => this.recorrer(cuerpo, base)));
  }

  private recorrer(valor: unknown, base: string, profundidad = 0): unknown {
    // Las respuestas son planas; el tope corta cualquier ciclo inesperado.
    if (profundidad > 8 || valor === null || typeof valor !== 'object') return valor;

    if (Array.isArray(valor)) {
      return valor.map((v) => this.recorrer(v, base, profundidad + 1));
    }

    if (valor instanceof Date) return valor;

    const objeto = valor as Record<string, unknown>;
    const salida: Record<string, unknown> = {};

    for (const [clave, v] of Object.entries(objeto)) {
      salida[clave] = this.recorrer(v, base, profundidad + 1);
    }

    if (typeof objeto['storageKey'] === 'string') {
      salida['url'] = `${base}/${objeto['storageKey']}`;
      salida['nombre'] = objeto['nombreOriginal'] ?? objeto['nombre'] ?? null;
    }

    return salida;
  }
}
