import { CommonModule } from '@angular/common';
import { Component, HostListener, signal } from '@angular/core';
import { Router, RouterModule } from '@angular/router';

/** Claves de los íconos dibujados en el menú móvil (ver header.html). */
type MenuIcon =
  | 'inicio'
  | 'nosotros'
  | 'servicios'
  | 'tramites'
  | 'filiales'
  | 'alojamiento'
  | 'recibos'
  | 'contacto';

interface MenuItem {
  readonly label: string;
  readonly ruta?: string;
  /** Sólo lo llevan los ítems de primer nivel; los hijos del dropdown no. */
  readonly icon?: MenuIcon;
  readonly children?: readonly MenuItem[];
}

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './header.html',
  styleUrl: './header.css',
})
export class Header {
  readonly isMenuOpen = signal(false);
  readonly openDropdown = signal<string | null>(null);

  readonly menuItems: readonly MenuItem[] = [
    { label: 'Inicio', ruta: '/', icon: 'inicio' },
    {
      label: 'Nosotros',
      icon: 'nosotros',
      children: [
        { label: 'Resumen', ruta: '/nosotros' },
        { label: 'Institucional', ruta: '/nosotros/institucional' },
        { label: 'Autoridades', ruta: '/nosotros/autoridades' },
      ],
    },
    {
      label: 'Servicios',
      icon: 'servicios',
      children: [
        { label: 'Todos los servicios', ruta: '/beneficios' },
        { label: 'Asesoramiento Contable', ruta: '/servicios/asesoramiento-contable' },
        { label: 'Asesoramiento Jurídico', ruta: '/servicios/asesoramiento-juridico' },
        { label: 'Bodas de Oro', ruta: '/servicios/bodas-de-oro' },
        { label: 'Subsidio por Casamiento', ruta: '/servicios/subsidio-casamiento' },
        { label: 'Subsidio por Hijo', ruta: '/servicios/subsidio-hijos' },
        { label: 'Subsidio por Sepelio', ruta: '/servicios/subsidio-sepelio' },
        { label: 'Turismo', ruta: '/servicios/turismo' },
        { label: 'Farmacia', ruta: '/servicios/farmacia' },
        { label: 'Evacuación', ruta: '/servicios/evacuacion' },
      ],
    },
    {
      label: 'Trámites',
      icon: 'tramites',
      children: [
        { label: 'Todos los trámites', ruta: '/tramites' },
        { label: 'Afiliación', ruta: '/tramites/afiliacion' },
        { label: 'Actualización de datos', ruta: '/tramites/actualizacion-datos' },
        { label: 'Alta familiar', ruta: '/tramites/alta-familiar' },
      ],
    },
    { label: 'Filiales', ruta: '/filiales', icon: 'filiales' },
    { label: 'Alojamiento', ruta: '/alojamiento', icon: 'alojamiento' },
    { label: 'Recibos', ruta: '/recibos', icon: 'recibos' },
    { label: 'Contacto', ruta: '/contacto', icon: 'contacto' },
  ];

  constructor(private readonly router: Router) {}

  navigateTo(ruta: string): void {
    this.router.navigate([ruta]);
    this.closeAll();
  }

  toggleDropdown(label: string): void {
    this.openDropdown.update((current) => (current === label ? null : label));
  }

  toggleMenu(): void {
    this.isMenuOpen.update((v) => !v);
    if (!this.isMenuOpen()) {
      this.openDropdown.set(null);
    }
    this.toggleBodyScroll();
  }

  closeMenu(): void {
    this.isMenuOpen.set(false);
    this.openDropdown.set(null);
    this.toggleBodyScroll();
  }

  closeAll(): void {
    this.closeMenu();
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    this.closeAll();
  }

  // Conservamos métodos por compatibilidad con tests existentes
  navigateToHome(): void { this.navigateTo('/'); }
  navigateToFiliales(): void { this.navigateTo('/filiales'); }
  navigateToNosotros(): void { this.navigateTo('/nosotros'); }
  navigateToContacto(): void { this.navigateTo('/contacto'); }
  navigateAndCloseMenu(route: string): void { this.navigateTo(route); }

  private toggleBodyScroll(): void {
    if (typeof document === 'undefined') return;
    if (this.isMenuOpen()) {
      document.body.classList.add('menu-open');
    } else {
      document.body.classList.remove('menu-open');
    }
  }
}
