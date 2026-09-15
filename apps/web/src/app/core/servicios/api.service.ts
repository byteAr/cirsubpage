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
      withCredentials: true,
    });
  }

  post<T>(ruta: string, cuerpo?: unknown): Observable<T> {
    return this.http.post<T>(`${this.base}${ruta}`, cuerpo ?? {}, { withCredentials: true });
  }

  patch<T>(ruta: string, cuerpo: unknown): Observable<T> {
    return this.http.patch<T>(`${this.base}${ruta}`, cuerpo, { withCredentials: true });
  }

  put<T>(ruta: string, cuerpo: unknown): Observable<T> {
    return this.http.put<T>(`${this.base}${ruta}`, cuerpo, { withCredentials: true });
  }

  delete<T>(ruta: string): Observable<T> {
    return this.http.delete<T>(`${this.base}${ruta}`, { withCredentials: true });
  }

  subir<T>(ruta: string, formulario: FormData): Observable<T> {
    return this.http.post<T>(`${this.base}${ruta}`, formulario, { withCredentials: true });
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
