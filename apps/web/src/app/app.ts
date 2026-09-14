import { isPlatformBrowser } from '@angular/common';
import { Component, DestroyRef, PLATFORM_ID, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ChildrenOutletContexts, NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { filter } from 'rxjs/operators';
import { Header } from './shared/components/header/header';
import { Footer } from './shared/components/footer/footer';
import { transicionRuta } from './shared/animaciones/transicion-ruta';
import { vigilarImagenesRotas } from './shared/imagenes-rotas';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, Header, Footer],
  templateUrl: './app.html',
  styleUrl: './app.css',
  animations: [transicionRuta],
})
export class App {
  private readonly contextos = inject(ChildrenOutletContexts);
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

  /**
   * Clave de la animación de ruta. Se usa el primer segmento para que moverse
   * dentro de una misma sección no dispare la transición completa.
   */
  claveAnimacion(): string {
    const contexto = this.contextos.getContext('primary');
    const segmentos: string[] =
      contexto?.route?.snapshot.url.map((s: { path: string }) => s.path) ?? [];
    return segmentos[0] || 'inicio';
  }
}
