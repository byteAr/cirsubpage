import { Injectable, inject } from '@angular/core';
import type { Observable } from 'rxjs';
import type { EstadoNovedad, Paginado } from '@cirsub/shared';
import { ApiService } from './api.service';

export interface MedioVariante {
  variante: string;
  formato: string;
  ancho: number;
  alto: number;
  url: string;
}

export interface Medio {
  id: string;
  nombre: string;
  mime: string;
  bytes: number;
  ancho: number | null;
  alto: number | null;
  alt: string | null;
  url: string;
  subidoPor: string | null;
  createdAt: string;
  variantes: MedioVariante[];
}

export interface RevisionNovedad {
  id: string;
  accion: 'APROBADA' | 'CAMBIOS_PEDIDOS';
  motivo: string | null;
  createdAt: string;
  revisor: { nombre: string };
}

export interface NovedadPanel {
  id: string;
  slug: string;
  estado: EstadoNovedad;
  titulo: string;
  bajada: string | null;
  cuerpoHtml: string;
  cuerpoJson: unknown;
  volanta: string | null;
  tituloSlide: string | null;
  bajadaSlide: string | null;
  enCarrusel: boolean;
  ordenCarrusel: number | null;
  carruselDesde: string | null;
  carruselHasta: string | null;
  programadaEn: string | null;
  destacada: boolean;
  publicadaEn: string | null;
  updatedAt: string;
  imagenSlide: Medio | null;
  portada: Medio | null;
  categoria: { id: string; slug: string; nombre: string } | null;
  autor: { id: string; nombre: string; email: string } | null;
  revisor: { id: string; nombre: string } | null;
  filial: { id: string; nombre: string } | null;
  revisiones?: RevisionNovedad[];
}

export interface GuardarNovedad {
  titulo: string;
  bajada?: string;
  cuerpoHtml?: string;
  cuerpoJson?: Record<string, unknown>;
  portadaId?: string;
  categoriaId?: string;
  volanta?: string;
  tituloSlide?: string;
  bajadaSlide?: string;
  imagenSlideId?: string;
  enCarrusel?: boolean;
  carruselDesde?: string;
  carruselHasta?: string;
  programadaEn?: string;
  destacada?: boolean;
}

export interface UsuarioPanel {
  id: string;
  nombre: string;
  email: string;
  estado: 'INVITADO' | 'ACTIVO' | 'SUSPENDIDO';
  ultimoAcceso: string | null;
  totpHabilitado: boolean;
  createdAt: string;
  rol: { id: string; slug: string; nombre: string; nivel: number };
  filial: { id: string; nombre: string } | null;
}

/** Llamadas del panel de administración. */
@Injectable({ providedIn: 'root' })
export class PanelService {
  private readonly api = inject(ApiService);

  // ───────────────────────────── Novedades ─────────────────────────────────

  novedades(filtro: { estado?: string; busqueda?: string; pagina?: number }) {
    return this.api.get<Paginado<NovedadPanel>>('/novedades', filtro);
  }

  novedad(id: string): Observable<NovedadPanel> {
    return this.api.get<NovedadPanel>(`/novedades/${id}`);
  }

  crearNovedad(datos: GuardarNovedad): Observable<NovedadPanel> {
    return this.api.post<NovedadPanel>('/novedades', datos);
  }

  actualizarNovedad(id: string, datos: GuardarNovedad): Observable<NovedadPanel> {
    return this.api.patch<NovedadPanel>(`/novedades/${id}`, datos);
  }

  enviarARevision(id: string): Observable<NovedadPanel> {
    return this.api.post<NovedadPanel>(`/novedades/${id}/enviar`);
  }

  aprobar(id: string): Observable<NovedadPanel> {
    return this.api.post<NovedadPanel>(`/novedades/${id}/aprobar`);
  }

  pedirCambios(id: string, motivo: string): Observable<NovedadPanel> {
    return this.api.post<NovedadPanel>(`/novedades/${id}/pedir-cambios`, { motivo });
  }

  publicar(id: string): Observable<NovedadPanel> {
    return this.api.post<NovedadPanel>(`/novedades/${id}/publicar`);
  }

  cancelar(id: string): Observable<NovedadPanel> {
    return this.api.post<NovedadPanel>(`/novedades/${id}/cancelar`);
  }

  archivar(id: string): Observable<NovedadPanel> {
    return this.api.post<NovedadPanel>(`/novedades/${id}/archivar`);
  }

  retomar(id: string): Observable<NovedadPanel> {
    return this.api.post<NovedadPanel>(`/novedades/${id}/retomar`);
  }

  eliminarNovedad(id: string) {
    return this.api.delete<void>(`/novedades/${id}`);
  }

  // ────────────────────────────── Carrusel ─────────────────────────────────

  carrusel(): Observable<NovedadPanel[]> {
    return this.api.get<NovedadPanel[]>('/novedades/carrusel');
  }

  reordenarCarrusel(orden: { id: string; orden: number }[]) {
    return this.api.put<NovedadPanel[]>('/novedades/carrusel/orden', orden);
  }

  // ─────────────────────────────── Medios ──────────────────────────────────

  medios(filtro: { pagina?: number; busqueda?: string; soloImagenes?: boolean } = {}) {
    return this.api.get<Paginado<Medio>>('/medios', filtro);
  }

  subirMedio(archivo: File, alt?: string): Observable<Medio> {
    const formulario = new FormData();
    formulario.append('archivo', archivo);
    if (alt) formulario.append('alt', alt);
    return this.api.subir<Medio>('/medios', formulario);
  }

  actualizarAlt(id: string, alt: string): Observable<Medio> {
    return this.api.patch<Medio>(`/medios/${id}`, { alt });
  }

  eliminarMedio(id: string) {
    return this.api.delete<void>(`/medios/${id}`);
  }

  // ────────────────────────────── Usuarios ─────────────────────────────────

  usuarios(filtro: { busqueda?: string; rol?: string; estado?: string } = {}) {
    return this.api.get<UsuarioPanel[]>('/usuarios', filtro);
  }

  roles() {
    return this.api.get<
      {
        id: string;
        slug: string;
        nombre: string;
        descripcion: string;
        nivel: number;
        permisos: { permiso: { slug: string }; alcance: string }[];
        asignables: { asignable: { slug: string } }[];
        _count: { usuarios: number };
      }[]
    >('/usuarios/roles');
  }

  rolesAsignables() {
    return this.api.get<{ id: string; slug: string; nombre: string; nivel: number }[]>(
      '/usuarios/roles/asignables',
    );
  }

  invitaciones() {
    return this.api.get<
      {
        id: string;
        email: string;
        nombre: string;
        expiraEn: string;
        createdAt: string;
        rol: { nombre: string };
        filial: { nombre: string } | null;
        invitadoPor: { nombre: string };
      }[]
    >('/usuarios/invitaciones');
  }

  invitar(datos: { nombre: string; email: string; rolId: string; filialId?: string }) {
    return this.api.post('/usuarios/invitaciones', datos);
  }

  reenviarInvitacion(id: string) {
    return this.api.post(`/usuarios/invitaciones/${id}/reenviar`);
  }

  editarUsuario(
    id: string,
    datos: { nombre?: string; estado?: string; rolId?: string; filialId?: string | null },
  ) {
    return this.api.patch<UsuarioPanel>(`/usuarios/${id}`, datos);
  }

  // ───────────────────────── Contenido institucional ───────────────────────

  filiales() {
    return this.api.get<{ id: string; nombre: string }[]>('/contenido/filiales');
  }

  auditoria(filtro: { pagina?: number; entidad?: string; nivel?: string } = {}) {
    return this.api.get<
      Paginado<{
        id: string;
        accion: string;
        entidad: string;
        resumen: string;
        nivel: string;
        ip: string | null;
        createdAt: string;
        usuario: { id: string; nombre: string; email: string } | null;
      }>
    >('/auditoria', filtro);
  }
}
