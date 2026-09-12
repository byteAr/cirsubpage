import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { REGLAS_CONTRASENA, fortalezaContrasena, validarContrasena } from '@cirsub/shared';
import { ApiService } from '../../../../core/servicios/api.service';

@Component({
  selector: 'app-restablecer',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './restablecer.html',
  styleUrl: '../../componentes/acceso.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Restablecer {
  private readonly api = inject(ApiService);
  private readonly ruta = inject(ActivatedRoute);
  private readonly router = inject(Router);

  readonly password = signal('');
  readonly repetida = signal('');
  readonly enviando = signal(false);
  readonly error = signal<string | null>(null);
  readonly listo = signal(false);

  readonly fortaleza = computed(() => fortalezaContrasena(this.password()));
  readonly problemas = computed(() => validarContrasena(this.password()));
  readonly coinciden = computed(
    () => this.repetida().length === 0 || this.password() === this.repetida(),
  );
  readonly puedeEnviar = computed(
    () =>
      this.problemas().length === 0 &&
      this.password() === this.repetida() &&
      this.repetida().length > 0,
  );

  readonly minimo = REGLAS_CONTRASENA.MIN;

  tieneMayuscula(): boolean {
    return /[A-ZÁÉÍÓÚÑ]/.test(this.password());
  }

  tieneNumero(): boolean {
    return /[0-9]/.test(this.password());
  }

  tieneLargo(): boolean {
    return this.password().length >= REGLAS_CONTRASENA.MIN;
  }

  async restablecer(): Promise<void> {
    if (!this.puedeEnviar() || this.enviando()) return;

    const token = this.ruta.snapshot.queryParamMap.get('token') ?? '';
    if (!token) {
      this.error.set('El enlace no trae el código de verificación.');
      return;
    }

    this.enviando.set(true);
    this.error.set(null);

    try {
      await firstValueFrom(
        this.api.post('/auth/restablecer', { token, password: this.password() }),
      );
      this.listo.set(true);
      // Cambiar la contraseña cierra todas las sesiones: hay que volver a entrar.
      setTimeout(() => void this.router.navigateByUrl('/admin/ingresar'), 2600);
    } catch (e) {
      const cuerpo = e instanceof HttpErrorResponse ? (e.error as { message?: string } | null) : null;
      this.error.set(cuerpo?.message ?? 'El enlace no es válido o ya venció.');
    } finally {
      this.enviando.set(false);
    }
  }
}
