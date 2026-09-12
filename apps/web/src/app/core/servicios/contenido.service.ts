import { Injectable, inject } from '@angular/core';
import { Observable, of, shareReplay } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import type {
  Autoridad,
  Contacto,
  Filial,
  NovedadDetalle,
  NovedadResumen,
  PaginaInfo,
  Paginado,
  SlideCarrusel,
} from '@cirsub/shared';
import { ApiService } from './api.service';

/**
 * Lectura del contenido público.
 *
 * Todo lo que antes estaba escrito a mano en el código ahora viene de la API.
 * Las listas que cambian poco se cachean con `shareReplay` para no repetir la
 * llamada en cada navegación.
 */
@Injectable({ providedIn: 'root' })
export class ContenidoService {
  private readonly api = inject(ApiService);

  private cacheFiliales?: Observable<Filial[]>;
  private cacheContactos?: Observable<Contacto[]>;
  private cacheAutoridades?: Observable<Autoridad[]>;

  carrusel(): Observable<SlideCarrusel[]> {
    return this.api.get<SlideCarrusel[]>('/publico/carrusel').pipe(catchError(() => of([])));
  }

  novedades(opciones: { pagina?: number; categoria?: string; busqueda?: string } = {}) {
    return this.api
      .get<Paginado<NovedadResumen>>('/publico/novedades', opciones)
      .pipe(
        catchError(() =>
          of({ items: [], total: 0, pagina: 1, porPagina: 9, totalPaginas: 1 } as Paginado<NovedadResumen>),
        ),
      );
  }

  novedad(slug: string): Observable<NovedadDetalle> {
    return this.api.get<NovedadDetalle>(`/publico/novedades/${slug}`);
  }

  categorias() {
    return this.api
      .get<{ slug: string; nombre: string }[]>('/publico/categorias')
      .pipe(catchError(() => of([])));
  }

  filiales(): Observable<Filial[]> {
    this.cacheFiliales ??= this.api
      .get<Filial[]>('/publico/filiales')
      .pipe(catchError(() => of([])), shareReplay({ bufferSize: 1, refCount: false }));
    return this.cacheFiliales;
  }

  contactos(): Observable<Contacto[]> {
    this.cacheContactos ??= this.api
      .get<Contacto[]>('/publico/contactos')
      .pipe(catchError(() => of([])), shareReplay({ bufferSize: 1, refCount: false }));
    return this.cacheContactos;
  }

  autoridades(): Observable<Autoridad[]> {
    this.cacheAutoridades ??= this.api
      .get<Autoridad[]>('/publico/autoridades')
      .pipe(catchError(() => of([])), shareReplay({ bufferSize: 1, refCount: false }));
    return this.cacheAutoridades;
  }

  /** Autoridades agrupadas tal como se dibuja el organigrama. */
  autoridadesPorGrupo(): Observable<{ titulo: string; autoridades: Autoridad[] }[]> {
    return this.autoridades().pipe(
      map((lista) => {
        const grupos = new Map<string, Autoridad[]>();
        for (const a of lista) {
          const actual = grupos.get(a.grupo) ?? [];
          actual.push(a);
          grupos.set(a.grupo, actual);
        }
        return [...grupos.entries()].map(([titulo, autoridades]) => ({ titulo, autoridades }));
      }),
    );
  }

  paginas(tipo?: 'SERVICIO' | 'TRAMITE' | 'INSTITUCIONAL'): Observable<PaginaInfo[]> {
    return this.api.get<PaginaInfo[]>('/publico/paginas', { tipo }).pipe(catchError(() => of([])));
  }

  pagina(slug: string): Observable<PaginaInfo> {
    return this.api.get<PaginaInfo>(`/publico/paginas/${slug}`);
  }
}
