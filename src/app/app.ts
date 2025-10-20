import { Component, signal } from '@angular/core';
import { RouterOutlet, ChildrenOutletContexts, Router, NavigationEnd } from '@angular/router';
import { Header } from "./shared/components/header/header";
import { Footer } from "./shared/components/footer/footer";
import { slideAnimation } from './shared/animations/route-animations';
import { filter } from 'rxjs/operators';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, Header, Footer],
  templateUrl: './app.html',
  styleUrl: './app.css',
  animations: [slideAnimation]
})
export class App {
  protected readonly title = signal('cirsubpage');
  private currentRoute = signal('');

  constructor(
    private contexts: ChildrenOutletContexts,
    private router: Router
  ) {
    // Escuchar cambios de ruta para activar animaciones
    this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe((event: NavigationEnd) => {
        this.currentRoute.set(event.url);
      });
  }

  // Método mejorado para obtener el estado de la ruta para las animaciones
  getRouteAnimationData() {
    const context = this.contexts.getContext('primary');
    if (context && context.route) {
      const url = context.route.snapshot.url.map(segment => segment.path).join('/');
      return url || 'home';
    }
    return this.currentRoute() || 'home';
  }
}
