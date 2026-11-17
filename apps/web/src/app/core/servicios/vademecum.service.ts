import { HttpBackend, HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, shareReplay } from 'rxjs';

/** Un medicamento del vademécum, tal como viene de la planilla. */
export interface Medicamento {
  readonly troquel: string;
  readonly nombre: string;
  readonly monodroga: string;
  readonly presentacion: string;
  /** Descuento para el asociado, en puntos: 30 o 40. */
  readonly porcentaje: number;
}

/**
 * Lista de medicamentos con descuento para asociados.
 *
 * Todavía no hay endpoint en el backend: se lee la maqueta que se armó desde la
 * planilla Excel y se sirve como archivo estático desde `public/maqueta/`. Es la
 * misma que usa la app de la credencial.
 *
 * Son unos 6.000 medicamentos (~730 kB). Se piden una sola vez por visita y se
 * comparten entre navegaciones con `shareReplay`.
 */
@Injectable({ providedIn: 'root' })
export class VademecumService {
  /*
    Cliente sin interceptores: el de autenticación trata como del panel todo lo
    que no sea `/publico/` y, antes de pedir el archivo, intentaba renovar la
    sesión contra la API. Para un archivo estático no corresponde.
  */
  private readonly http = new HttpClient(inject(HttpBackend));
  private cache?: Observable<Medicamento[]>;

  medicamentos(): Observable<Medicamento[]> {
    // ⚠️ ÚNICO LUGAR A CAMBIAR cuando exista el endpoint real: reemplazar esta
    // línea por `inject(ApiService).get<Medicamento[]>('/publico/vademecum')` (o la
    // ruta que defina el backend; si empieza con `/publico/` el interceptor la deja
    // pasar sin sesión), y borrar `public/maqueta/vademecum.json` y el cliente de arriba.
    this.cache ??= this.http.get<Medicamento[]>('/maqueta/vademecum.json').pipe(shareReplay(1));
    return this.cache;
  }
}
