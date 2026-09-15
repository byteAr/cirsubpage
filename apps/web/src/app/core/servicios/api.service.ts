import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { BASE_API } from '../base-api';

/**
 * Acceso al backend. Concentra la URL base y el armado de parámetros para que
 * ningún componente arme rutas a mano.
 */
@Injectable({ providedIn: 'root' })
export class ApiService {
  private readonly http = inject(HttpClient);
  private readonly base = inject(BASE_API).replace(/\/$/, '');

  get<T>(ruta: string, params?: Record<string, string | number | boolean | undefined>): Observable<T> {
    return this.http.get<T>(`${this.base}${ruta}`, {
      params: this.aParams(params),
      withCredentials: this.conCredenciales(ruta),
    });
  }

  post<T>(ruta: string, cuerpo?: unknown): Observable<T> {
    return this.http.post<T>(`${this.base}${ruta}`, cuerpo ?? {}, {
      withCredentials: this.conCredenciales(ruta),
    });
  }

  patch<T>(ruta: string, cuerpo: unknown): Observable<T> {
    return this.http.patch<T>(`${this.base}${ruta}`, cuerpo, {
      withCredentials: this.conCredenciales(ruta),
    });
  }

  put<T>(ruta: string, cuerpo: unknown): Observable<T> {
    return this.http.put<T>(`${this.base}${ruta}`, cuerpo, {
      withCredentials: this.conCredenciales(ruta),
    });
  }

  delete<T>(ruta: string): Observable<T> {
    return this.http.delete<T>(`${this.base}${ruta}`, {
      withCredentials: this.conCredenciales(ruta),
    });
  }

  subir<T>(ruta: string, formulario: FormData): Observable<T> {
    return this.http.post<T>(`${this.base}${ruta}`, formulario, {
      withCredentials: this.conCredenciales(ruta),
    });
  }

  /**
   * El contenido público viaja sin credenciales, a propósito.
   *
   * Angular deja fuera del caché de transferencia toda petición que lleve
   * `withCredentials`. Mandando la cookie en una lectura pública, lo que el
   * servidor ya había traído no llegaba al navegador: al hidratar, el navegador
   * repetía cada llamada, las listas volvían a quedar vacías mientras tanto y el
   * contenido renderizado desaparecía y reaparecía. Ese era el parpadeo.
   *
   * Ninguna de estas rutas mira la sesión: son las mismas que el interceptor de
   * autenticación deja pasar sin tocar.
   */
  private conCredenciales(ruta: string): boolean {
    return !ruta.startsWith('/publico/');
  }

  private aParams(valores?: Record<string, string | number | boolean | undefined>): HttpParams {
    let params = new HttpParams();
    if (!valores) return params;
    for (const [clave, valor] of Object.entries(valores)) {
      if (valor !== undefined && valor !== null && valor !== '') {
        params = params.set(clave, String(valor));
      }
    }
    return params;
  }
}
