import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { requiereSegundoFactor } from '@cirsub/shared';
import { SesionService } from '../../../../core/servicios/sesion.service';

@Component({
  selector: 'app-ingreso',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './ingreso.html',
  styleUrl: '../../componentes/acceso.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Ingreso implements OnInit {
  private readonly sesion = inject(SesionService);
  private readonly router = inject(Router);
  private readonly ruta = inject(ActivatedRoute);

  readonly email = signal('');
  readonly password = signal('');
  readonly codigo = signal('');

  readonly pidiendoCodigo = signal(false);
  readonly enviando = signal(false);
  readonly error = signal<string | null>(null);

  ngOnInit(): void {
    // Si ya hay cookie válida, no tiene sentido mostrar el formulario.
    void this.sesion.restaurar().then(() => {
      if (this.sesion.autenticado()) void this.irAlPanel();
    });
  }

  async ingresar(): Promise<void> {
    if (this.enviando()) return;

    this.enviando.set(true);
    this.error.set(null);

    try {
      const resultado = await this.sesion.ingresar(
        this.email().trim(),
        this.password(),
        this.pidiendoCodigo() ? this.codigo() : undefined,
      );

      if (requiereSegundoFactor(resultado)) {
        this.pidiendoCodigo.set(true);
        return;
      }

      await this.irAlPanel();
    } catch (e) {
      this.error.set(this.mensaje(e));
    } finally {
      this.enviando.set(false);
    }
  }

  private async irAlPanel(): Promise<void> {
    const volver = this.ruta.snapshot.queryParamMap.get('volver');
    await this.router.navigateByUrl(volver ?? '/admin');
  }

  private mensaje(e: unknown): string {
    if (e instanceof HttpErrorResponse) {
      // Un estado 0 es una falla de red o de origen permitido. El cuerpo trae
      // el mensaje técnico del navegador, que no le dice nada a quien lo lee.
      if (e.status === 0) {
        return 'No pudimos conectarnos con el servidor. Revisá tu conexión e intentá de nuevo.';
      }

      const cuerpo = e.error as { message?: string | string[] } | null;
      const m = cuerpo?.message;
      if (Array.isArray(m)) return m[0] ?? 'No pudimos ingresar';
      if (typeof m === 'string') return m;
    }
    return 'No pudimos ingresar. Revisá los datos e intentá otra vez.';
  }
}
