import { isPlatformBrowser } from '@angular/common';
import { Component, DestroyRef, PLATFORM_ID, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { filter } from 'rxjs/operators';
import { Header } from './shared/components/header/header';
import { Footer } from './shared/components/footer/footer';
import { vigilarImagenesRotas } from './shared/imagenes-rotas';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, Header, Footer],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {
  private readonly router = inject(Router);
  private readonly plataforma = inject(PLATFORM_ID);
  private readonly alDestruir = inject(DestroyRef);

  /** El panel trae su propia estructura: sin la cabecera ni el pie del sitio. */
  readonly esPanel = signal(false);

  constructor() {
    this.esPanel.set(this.router.url.startsWith('/admin'));

    // `takeUntilDestroyed` corta la suscripción con el componente, así no queda
    // viva después de que el inyector se destruye durante el renderizado.
    this.router.events
      .pipe(
        filter((e): e is NavigationEnd => e instanceof NavigationEnd),
        takeUntilDestroyed(),
      )
      .subscribe((e) => this.esPanel.set(e.urlAfterRedirects.startsWith('/admin')));

    if (isPlatformBrowser(this.plataforma)) {
      this.alDestruir.onDestroy(vigilarImagenesRotas(document));
    }
  }
}
