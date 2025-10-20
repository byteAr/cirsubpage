import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { Router, RouterModule } from '@angular/router';

@Component({
  selector: 'app-header',
  imports: [CommonModule, RouterModule],
  templateUrl: './header.html',
  styleUrl: './header.css'
})
export class Header {
  isMenuOpen = false;

  constructor(private router: Router) {}

  /**
   * Navega al inicio de la aplicación
   */
  navigateToHome(): void {
    this.router.navigate(['/']);
  }

  /**
   * Navega a la página de filiales
   */
  navigateToFiliales(): void {
    this.router.navigate(['/filiales']);
  }

  /**
   * Navega a la página de contacto
   */
  navigateToContacto(): void {
    this.router.navigate(['/contacto']);
  }

  /**
   * Navega a una ruta específica y cierra el menú móvil
   */
  navigateAndCloseMenu(route: string): void {
    this.router.navigate([route]);
    this.closeMenu();
  }

  /**
   * Alterna el estado del menú móvil
   */
  toggleMenu(): void {
    this.isMenuOpen = !this.isMenuOpen;
    this.toggleBodyScroll();
  }

  /**
   * Cierra el menú móvil
   */
  closeMenu(): void {
    this.isMenuOpen = false;
    this.toggleBodyScroll();
  }

  /**
   * Controla el scroll del body cuando el menú está abierto
   */
  private toggleBodyScroll(): void {
    if (typeof document !== 'undefined') {
      if (this.isMenuOpen) {
        document.body.classList.add('menu-open');
      } else {
        document.body.classList.remove('menu-open');
      }
    }
  }
}
