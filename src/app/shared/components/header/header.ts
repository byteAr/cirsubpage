import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-header',
  imports: [CommonModule],
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
