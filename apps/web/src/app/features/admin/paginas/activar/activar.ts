import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { REGLAS_CONTRASENA, fortalezaContrasena, validarContrasena } from '@cirsub/shared';
import { ApiService } from '../../../../core/servicios/api.service';
import { SesionService } from '../../../../core/servicios/sesion.service';

interface DatosInvitacion {
  nombre: string;
  email: string;
  rol: string;
  filial: string | null;
}

/**
 * Activación de cuenta desde el enlace de invitación.
 *
 * Primero se valida el token contra la API: si venció o ya se usó, se muestra
 * el aviso antes de que la persona escriba una contraseña al pedo.
 */
@Component({
  selector: 'app-activar',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './activar.html',
  styleUrl: '../../componentes/acceso.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Activar implements OnInit {
  private readonly api = inject(ApiService);
  private readonly sesion = inject(SesionService);
  private readonly ruta = inject(ActivatedRoute);
  private readonly router = inject(Router);

  readonly invitacion = signal<DatosInvitacion | null>(null);
  readonly cargando = signal(true);
  readonly invalida = signal<string | null>(null);

  readonly password = signal('');
  readonly repetida = signal('');
  readonly enviando = signal(false);
  readonly error = signal<string | null>(null);

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

  private token = '';

  ngOnInit(): void {
    this.token = this.ruta.snapshot.queryParamMap.get('token') ?? '';

    if (!this.token) {
      this.invalida.set('El enlace no trae el código de invitación.');
      this.cargando.set(false);
      return;
    }

    this.api.get<DatosInvitacion>('/auth/invitacion', { token: this.token }).subscribe({
      next: (d) => {
        this.invitacion.set(d);
        this.cargando.set(false);
      },
      error: (e: HttpErrorResponse) => {
        const cuerpo = e.error as { message?: string } | null;
        this.invalida.set(cuerpo?.message ?? 'La invitación no es válida o ya venció.');
        this.cargando.set(false);
      },
    });
  }

  tieneMayuscula(): boolean {
    return /[A-ZÁÉÍÓÚÑ]/.test(this.password());
  }

  tieneNumero(): boolean {
    return /[0-9]/.test(this.password());
  }

  tieneLargo(): boolean {
    return this.password().length >= REGLAS_CONTRASENA.MIN;
  }

  async activar(): Promise<void> {
    if (!this.puedeEnviar() || this.enviando()) return;

    this.enviando.set(true);
    this.error.set(null);

    try {
      await this.sesion.activarCuenta(this.token, this.password());
      await this.router.navigateByUrl('/admin');
    } catch (e) {
      const cuerpo = e instanceof HttpErrorResponse ? (e.error as { message?: string } | null) : null;
      this.error.set(cuerpo?.message ?? 'No pudimos activar la cuenta. Probá de nuevo.');
    } finally {
      this.enviando.set(false);
    }
  }
}
