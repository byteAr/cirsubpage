import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { ApiService } from '../../../../core/servicios/api.service';

@Component({
  selector: 'app-recuperar',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './recuperar.html',
  styleUrl: '../../componentes/acceso.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Recuperar {
  private readonly api = inject(ApiService);

  readonly email = signal('');
  readonly enviando = signal(false);
  readonly enviado = signal(false);

  async pedir(): Promise<void> {
    if (this.enviando()) return;
    this.enviando.set(true);

    try {
      await firstValueFrom(this.api.post('/auth/recuperar', { email: this.email().trim() }));
    } catch {
      // Se responde igual exista o no la cuenta: no revelamos qué correos
      // están dados de alta.
    } finally {
      this.enviando.set(false);
      this.enviado.set(true);
    }
  }
}
