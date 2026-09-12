import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { firstValueFrom } from 'rxjs';
import { MODULOS_PERMISOS, REGLAS_CONTRASENA, fortalezaContrasena, validarContrasena } from '@cirsub/shared';
import { ApiService } from '../../../../core/servicios/api.service';
import { SesionService } from '../../../../core/servicios/sesion.service';

@Component({
  selector: 'app-perfil',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './perfil.html',
  styleUrls: ['../../componentes/panel.css', './perfil.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Perfil {
  private readonly api = inject(ApiService);
  readonly sesion = inject(SesionService);

  readonly actual = signal('');
  readonly nueva = signal('');
  readonly repetida = signal('');
  readonly enviando = signal(false);
  readonly error = signal<string | null>(null);
  readonly exito = signal<string | null>(null);

  readonly fortaleza = computed(() => fortalezaContrasena(this.nueva()));
  readonly problemas = computed(() => validarContrasena(this.nueva()));
  readonly coinciden = computed(
    () => this.repetida().length === 0 || this.nueva() === this.repetida(),
  );
  readonly puedeGuardar = computed(
    () =>
      this.actual().length > 0 &&
      this.problemas().length === 0 &&
      this.nueva() === this.repetida() &&
      this.repetida().length > 0,
  );

  readonly minimo = REGLAS_CONTRASENA.MIN;
  readonly modulos = MODULOS_PERMISOS;

  /** Permisos efectivos del usuario, agrupados para que se lean de un vistazo. */
  readonly misPermisos = computed(() => {
    const propios = this.sesion.usuario()?.permisos ?? [];
    return this.modulos
      .map((m) => ({
        nombre: m.nombre,
        permisos: m.permisos
          .map((p) => ({
            etiqueta: p.etiqueta,
            alcance: propios.find((x) => x.permiso === p.permiso)?.alcance ?? null,
          }))
          .filter((p) => p.alcance !== null),
      }))
      .filter((m) => m.permisos.length > 0);
  });

  tieneMayuscula(): boolean {
    return /[A-ZÁÉÍÓÚÑ]/.test(this.nueva());
  }

  tieneNumero(): boolean {
    return /[0-9]/.test(this.nueva());
  }

  tieneLargo(): boolean {
    return this.nueva().length >= REGLAS_CONTRASENA.MIN;
  }

  async cambiar(): Promise<void> {
    if (!this.puedeGuardar() || this.enviando()) return;

    this.enviando.set(true);
    this.error.set(null);
    this.exito.set(null);

    try {
      await firstValueFrom(
        this.api.post('/auth/cambiar-password', { actual: this.actual(), nueva: this.nueva() }),
      );
      this.exito.set('Listo, cambiamos tu contraseña.');
      this.actual.set('');
      this.nueva.set('');
      this.repetida.set('');
    } catch (e) {
      const cuerpo = (e as { error?: { message?: string } }).error;
      this.error.set(cuerpo?.message ?? 'No pudimos cambiar la contraseña.');
    } finally {
      this.enviando.set(false);
    }
  }

  async cerrarTodas(): Promise<void> {
    if (!confirm('Esto cierra tu sesión en todos los dispositivos. ¿Seguimos?')) return;

    try {
      await firstValueFrom(this.api.post('/auth/cerrar-todas'));
      await this.sesion.salir();
    } catch {
      this.error.set('No pudimos cerrar las sesiones.');
    }
  }
}
