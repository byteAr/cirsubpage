import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

export interface FilialesCarouselItem {
  id: string;
  nombre: string;
  imageUrl: string;
}

@Component({
  selector: 'app-filiales-carousel',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="relative w-full">
      <!-- Carrusel container -->
      <div class="relative overflow-hidden">
        <div 
          class="flex transition-transform duration-500 ease-in-out gap-3 sm:gap-4 px-1 sm:px-0"
          [style.transform]="'translateX(-' + (currentIndex * slideWidth) + '%)'">
          
          @for (filial of filialesItems; track filial.id; let i = $index) {
            <div 
              class="flex-shrink-0 w-[calc(50%-0.5rem)] sm:w-1/2 md:w-1/3 lg:w-1/4 xl:w-1/5 cursor-pointer group"
              (click)="onFilialClick(filial)">
              
              <!-- Card con altura fija -->
              <div class="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden group-hover:scale-105 h-50 sm:h-72 lg:h-60 mb-5 flex flex-col">
                <!-- Imagen -->
                <div class="relative h-32 sm:h-36 lg:h-35 overflow-hidden flex-shrink-0">
                  <img 
                    [src]="filial.imageUrl" 
                    [alt]="filial.nombre"
                    class="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                    loading="lazy">
                  
                  <!-- Overlay sutil -->
                  <div class="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                </div>
                
                <!-- Contenido con altura fija -->
                <div class="p-4 sm:p-6 flex-1 flex flex-col justify-start pt-3 sm:pt-4">
                  <h4 class="text-base sm:text-lg font-bold text-gray-900 mb-2 sm:mb-3 group-hover:text-teal-600 transition-colors line-clamp-2 leading-tight">
                    {{ filial.nombre }}
                  </h4>
                 
                </div>
              </div>
            </div>
          }
        </div>

        <!-- Botones de navegación -->
        <button
          class="absolute left-0 top-1/2 transform -translate-y-1/2 -translate-x-4 w-10 h-10 bg-white rounded-full shadow-lg border border-gray-200 flex items-center justify-center hover:bg-gray-50 transition-all duration-300 z-10"
          [class.opacity-50]="currentIndex === 0"
          [class.cursor-not-allowed]="currentIndex === 0"
          [disabled]="currentIndex === 0"
          (click)="previousSlide()">
          <svg class="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"></path>
          </svg>
        </button>

        <button
          class="absolute right-0 top-1/2 transform -translate-y-1/2 translate-x-4 w-10 h-10 bg-white rounded-full shadow-lg border border-gray-200 flex items-center justify-center hover:bg-gray-50 transition-all duration-300 z-10"
          [class.opacity-50]="isAtEnd()"
          [class.cursor-not-allowed]="isAtEnd()"
          [disabled]="isAtEnd()"
          (click)="nextSlide()">
          <svg class="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path>
          </svg>
        </button>
      </div>

    </div>
  `,
  styles: [`
    /* Animaciones suaves */
    .group:hover .group-hover\\:scale-105 {
      transform: scale(1.05);
    }
    
    .group:hover .group-hover\\:scale-110 {
      transform: scale(1.1);
    }
    
    /* Mejora para dispositivos táctiles */
    @media (hover: none) and (pointer: coarse) {
      .hover\\:shadow-xl:hover {
        box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
      }
    }
    
    /* Line clamp para nombres largos */
    .line-clamp-2 {
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    
    /* Responsive adjustments */
    @media (max-width: 640px) {
      .gap-4 {
        gap: 0.75rem;
      }
    }
  `]
})
export class FilialesCarouselComponent implements OnInit {
  @Input() filialesItems: FilialesCarouselItem[] = [];

  currentIndex = 0;
  slideWidth = 100; // Porcentaje por slide

  constructor(private router: Router) {}

  ngOnInit(): void {
    this.calculateSlideWidth();
    // Escuchar cambios de tamaño de ventana
    if (typeof window !== 'undefined') {
      window.addEventListener('resize', () => this.calculateSlideWidth());
    }
  }

  calculateSlideWidth(): void {
    if (typeof window === 'undefined') return;
    
    const width = window.innerWidth;
    if (width >= 1280) { // xl
      this.slideWidth = 20; // 5 cards visible
    } else if (width >= 1024) { // lg
      this.slideWidth = 25; // 4 cards visible
    } else if (width >= 768) { // md
      this.slideWidth = 33.333; // 3 cards visible
    } else if (width >= 640) { // sm
      this.slideWidth = 50; // 2 cards visible
    } else {
      this.slideWidth = 40; // 2.5 cards visible (muestra 2 completas + mitad de la tercera)
    }
  }

  nextSlide(): void {
    if (!this.isAtEnd()) {
      this.currentIndex++;
    }
  }

  previousSlide(): void {
    if (this.currentIndex > 0) {
      this.currentIndex--;
    }
  }

  goToSlide(index: number): void {
    this.currentIndex = index;
  }

  isAtEnd(): boolean {
    const maxIndex = this.getMaxIndex();
    return this.currentIndex >= maxIndex;
  }

  getMaxIndex(): number {
    if (typeof window === 'undefined') return 0;
    
    const width = window.innerWidth;
    let itemsPerView = 1;
    
    if (width >= 1280) {
      itemsPerView = 5;
    } else if (width >= 1024) {
      itemsPerView = 4;
    } else if (width >= 768) {
      itemsPerView = 3;
    } else if (width >= 640) {
      itemsPerView = 2;
    } else {
      itemsPerView = 2.5; // En mobile muestra 2.5 cards
    }
    
    return Math.max(0, Math.ceil(this.filialesItems.length - itemsPerView));
  }


  onFilialClick(filial: FilialesCarouselItem): void {
    // Navegar a filiales cuando se haga click en cualquier card
    this.verTodas();
  }

  verTodas(): void {
    this.router.navigate(['/filiales']);
  }
}
