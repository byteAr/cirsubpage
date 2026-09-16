import { isPlatformBrowser } from '@angular/common';
import { Component, DestroyRef, PLATFORM_ID, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { filter } from 'rxjs/operators';
import { Header } from './shared/components/header/header';
import { Footer } from './shared/components/footer/footer';
import { vigilarImagenesRotas } from './shared/imagenes-rotas';
import { Seo, type Metadatos } from './core/servicios/seo.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, Header, Footer],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {
  private readonly router = inject(Router);
  private readonly rutaRaiz = inject(ActivatedRoute);
  private readonly plataforma = inject(PLATFORM_ID);
  private readonly alDestruir = inject(DestroyRef);
  private readonly seo = inject(Seo);

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
      .subscribe((e) => {
        this.esPanel.set(e.urlAfterRedirects.startsWith('/admin'));
        this.aplicarMetadatos();
      });

    if (isPlatformBrowser(this.plataforma)) {
      this.alDestruir.onDestroy(vigilarImagenesRotas(document));
    }
  }

  /**
   * Los metadatos declarados en la ruta, en cada navegación.
   *
   * Va acá y no en cada vista porque en una aplicación de una sola página las
   * etiquetas viven en el mismo documento de principio a fin: si cada vista se
   * ocupara sólo de las suyas, las de la anterior quedarían puestas y se
   * compartiría la nota equivocada. Desde un único lugar que corre siempre, eso
   * no puede pasar.
   *
   * Las vistas cuyo contenido viene de la base —una novedad, una página
   * informativa— vuelven a llamar al servicio cuando llegan los datos y pisan
   * esto con lo suyo.
   */
  private aplicarMetadatos(): void {
    if (this.router.url.startsWith('/admin')) return;

    let ruta = this.rutaRaiz;
    while (ruta.firstChild) ruta = ruta.firstChild;

    const declarados = ruta.snapshot.data['seo'] as Metadatos | undefined;

    this.seo.aplicar(
      declarados ?? {
        titulo: 'CIRSUB',
        descripcion:
          'Mutual del Círculo de Suboficiales de Gendarmería Nacional Argentina. Subsidios, reintegros y asesoramiento para los asociados y sus familias.',
      },
    );
  }
}
