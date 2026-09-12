import { Injectable, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import type { Alcance, Permiso, RespuestaIngreso, ResultadoIngreso, UsuarioSesion } from '@cirsub/shared';
import { ApiService } from './api.service';

/**
 * Estado de la sesión del panel.
 *
 * El token de acceso vive en memoria, nunca en `localStorage`: si alguien
 * inyecta un script en la página, no puede leerlo. La renovación va contra la
 * cookie de refresco, que el navegador maneja sola y el JavaScript no ve.
 */
@Injectable({ providedIn: 'root' })
export class SesionService {
  private readonly api = inject(ApiService);
  private readonly router = inject(Router);

  private token: string | null = null;
  private vencimiento = 0;
  private renovacionEnCurso: Promise<string | null> | null = null;

  readonly usuario = signal<UsuarioSesion | null>(null);
  readonly cargando = signal(true);

  readonly autenticado = computed(() => this.usuario() !== null);
  readonly esSuperadmin = computed(() => this.usuario()?.rol.slug === 'superadmin');

  tokenActual(): string | null {
    return this.token;
  }

  /** ¿Tiene este permiso, con cualquier alcance? */
  puede(permiso: Permiso): boolean {
    return this.usuario()?.permisos.some((p) => p.permiso === permiso) ?? false;
  }

  /** Alcance con el que lo tiene, o null si no lo tiene. */
  alcance(permiso: Permiso): Alcance | null {
    return this.usuario()?.permisos.find((p) => p.permiso === permiso)?.alcance ?? null;
  }

  puedeAlguno(...permisos: Permiso[]): boolean {
    return permisos.some((p) => this.puede(p));
  }

  async ingresar(email: string, password: string, codigoTotp?: string): Promise<ResultadoIngreso> {
    const respuesta = await firstValueFrom(
      this.api.post<ResultadoIngreso>('/auth/ingresar', { email, password, codigoTotp }),
    );
    if (!('requiereTotp' in respuesta)) this.aplicar(respuesta);
    return respuesta;
  }

  async activarCuenta(token: string, password: string): Promise<void> {
    const respuesta = await firstValueFrom(
      this.api.post<RespuestaIngreso>('/auth/activar', { token, password }),
    );
    this.aplicar(respuesta);
  }

  /** Se llama al arrancar la aplicación: si hay cookie válida, recupera la sesión. */
  async restaurar(): Promise<void> {
    this.cargando.set(true);
    try {
      await this.renovar();
    } catch {
      this.limpiar();
    } finally {
      this.cargando.set(false);
    }
  }

  /**
   * Devuelve un token válido, renovándolo si está por vencer.
   * Las llamadas concurrentes comparten la misma renovación.
   */
  async tokenValido(): Promise<string | null> {
    if (this.token && Date.now() < this.vencimiento - 30_000) return this.token;
    this.renovacionEnCurso ??= this.renovar().finally(() => {
      this.renovacionEnCurso = null;
    });
    return this.renovacionEnCurso;
  }

  async salir(): Promise<void> {
    try {
      await firstValueFrom(this.api.post<void>('/auth/salir'));
    } finally {
      this.limpiar();
      void this.router.navigate(['/admin/ingresar']);
    }
  }

  private async renovar(): Promise<string | null> {
    const respuesta = await firstValueFrom(this.api.post<RespuestaIngreso>('/auth/refrescar'));
    this.aplicar(respuesta);
    return this.token;
  }

  private aplicar(respuesta: RespuestaIngreso): void {
    this.token = respuesta.accessToken;
    this.vencimiento = Date.now() + respuesta.expiraEn * 1000;
    this.usuario.set(respuesta.usuario);
  }

  private limpiar(): void {
    this.token = null;
    this.vencimiento = 0;
    this.usuario.set(null);
  }
}
