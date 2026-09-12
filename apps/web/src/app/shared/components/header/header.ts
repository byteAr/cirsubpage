import { CommonModule } from '@angular/common';
import { Component, HostListener, signal } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { environment } from '../../../../environments/environment';

interface ItemMenu {
  readonly etiqueta: string;
  readonly ruta?: string;
  readonly icono?: string;
  readonly hijos?: readonly { readonly etiqueta: string; readonly ruta: string }[];
}

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  templateUrl: './header.html',
  styleUrl: './header.css',
})
export class Header {
  readonly menuAbierto = signal(false);
  readonly desplegado = signal<string | null>(null);
  readonly compacto = signal(false);

  readonly urlCredencial = environment.urlCredencial;

  readonly menu: readonly ItemMenu[] = [
    { etiqueta: 'Inicio', ruta: '/', icono: 'inicio' },
    {
      etiqueta: 'Nosotros',
      icono: 'nosotros',
      hijos: [
        { etiqueta: 'Quiénes somos', ruta: '/nosotros' },
        { etiqueta: 'Institucional', ruta: '/nosotros/institucional' },
        { etiqueta: 'Autoridades', ruta: '/nosotros/autoridades' },
      ],
    },
    { etiqueta: 'Novedades', ruta: '/novedades', icono: 'novedades' },
    { etiqueta: 'Servicios', ruta: '/beneficios', icono: 'servicios' },
    { etiqueta: 'Trámites', ruta: '/tramites', icono: 'tramites' },
    { etiqueta: 'Filiales', ruta: '/filiales', icono: 'filiales' },
    { etiqueta: 'Alojamiento', ruta: '/alojamiento', icono: 'alojamiento' },
    { etiqueta: 'Recibos', ruta: '/recibos', icono: 'recibos' },
    { etiqueta: 'Contacto', ruta: '/contacto', icono: 'contacto' },
  ];

  constructor(private readonly router: Router) {}

  @HostListener('window:scroll')
  alHacerScroll(): void {
    if (typeof window === 'undefined') return;
    this.compacto.set(window.scrollY > 24);
  }

  @HostListener('document:keydown.escape')
  alEscape(): void {
    this.cerrarTodo();
  }

  alternarDespliegue(etiqueta: string): void {
    this.desplegado.update((actual) => (actual === etiqueta ? null : etiqueta));
  }

  alternarMenu(): void {
    this.menuAbierto.update((v) => !v);
    this.bloquearScroll();
  }

  cerrarTodo(): void {
    this.menuAbierto.set(false);
    this.desplegado.set(null);
    this.bloquearScroll();
  }

  irA(ruta: string): void {
    void this.router.navigate([ruta]);
    this.cerrarTodo();
  }

  private bloquearScroll(): void {
    if (typeof document === 'undefined') return;
    document.body.style.overflow = this.menuAbierto() ? 'hidden' : '';
  }
}
