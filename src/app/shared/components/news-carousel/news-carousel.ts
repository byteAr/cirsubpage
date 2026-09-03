import { Component, Input, OnInit, OnDestroy, AfterViewInit, OnChanges, SimpleChanges, PLATFORM_ID, Inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';

export interface NewsItem {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  imageUrl: string;
  overlayColor: string;
  clipPath: string;
  buttonText: string;
  buttonAction?: () => void;
}

@Component({
  selector: 'app-news-carousel',
  standalone: true,
  imports: [CommonModule],
  template: `
    <!--
      flex-col: el contador "N de M" va DEBAJO del carrusel. Antes era hermano en
      una fila flex y quedaba comprimido en una columna angosta ("1 / de / 4").
    -->
    <div class="relative w-full overflow-hidden flex flex-col items-center">
      <!--
        Alto: en mobile 4/5 (vertical) porque en 16/9 la caja mide ~211px de alto
        en un teléfono de 375px y el texto del slide se desbordaba.
      -->
      <div
        class="relative w-full max-w-5xl overflow-hidden rounded-3xl shadow-xl bg-gradient-to-br from-slate-100 to-slate-200 aspect-[4/5] sm:aspect-video"
        (mouseenter)="stopAutoPlay()"
        (mouseleave)="startAutoPlay()">

        <!-- Cards del carrusel -->
        <div
          class="flex transition-transform duration-700 ease-in-out h-full touch-pan-y"
          [style.transform]="'translateX(-' + (currentIndex * 100) + '%)'"
          (touchstart)="onTouchStart($event)"
          (touchend)="onTouchEnd($event)"
          (touchmove)="onTouchMove($event)">

          @for (item of newsItems; track item.id; let i = $index) {
            <div class="min-w-full h-full relative overflow-hidden group">

              <!-- Imagen completa (object-contain = no recorta) -->
              <div class="absolute inset-0 flex items-center justify-center">
                <img
                  [src]="item.imageUrl"
                  [alt]="item.title || 'slide ' + (i + 1)"
                  class="max-h-full max-w-full object-contain transition-transform duration-700 ease-out group-hover:scale-[1.02] select-none"
                  loading="lazy"
                  draggable="false" />
              </div>

              <!-- Overlay principal con forma moderna -->
              @if (item.overlayColor) {
                <div
                  class="absolute inset-0 transition-all duration-700 ease-out backdrop-blur-[1px] pointer-events-none"
                  [style.background]="item.overlayColor"
                  [style.clip-path]="isActive(i) ? item.clipPath : 'polygon(0 0, 0% 0, 0% 100%, 0% 100%)'"
                  [class.opacity-95]="isActive(i)"
                  [class.opacity-80]="!isActive(i)">
                </div>
              }

              <!-- Patrón decorativo -->
              @if (item.title) {
                <div class="absolute top-0 right-0 w-32 h-32 opacity-10 pointer-events-none">
                  <svg viewBox="0 0 100 100" class="w-full h-full text-white">
                    <defs>
                      <pattern [id]="getPatternId(i)" x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
                        <circle cx="10" cy="10" r="2" fill="currentColor" opacity="0.3"/>
                      </pattern>
                    </defs>
                    <rect width="100" height="100" [attr.fill]="getPatternUrl(i)"/>
                  </svg>
                </div>
              }

              <!-- Contenido principal (textos + botón) -->
              @if (item.title || item.subtitle || item.description || item.buttonText) {
                <!--
                  pb-24 en mobile: deja libre la franja inferior de flechas + puntos.
                  pl-24 desde sm: la flecha izquierda se superponía ~32px al texto.
                -->
                <div class="relative z-10 h-full flex items-center p-5 pb-24 sm:p-8 sm:pb-8 lg:p-10 xl:p-12 sm:pl-24 lg:pl-28 xl:pl-32">
                  <div class="w-full max-w-none sm:max-w-sm md:max-w-md lg:max-w-lg xl:max-w-2xl">

                    @if (item.subtitle) {
                      <div class="inline-flex items-center px-3 py-1 rounded-full bg-white/20 backdrop-blur-md border border-white/30 mb-4 transform transition-all duration-700 delay-100"
                           [class.translate-y-0]="isActive(i)"
                           [class.translate-y-8]="!isActive(i)"
                           [class.opacity-100]="isActive(i)"
                           [class.opacity-0]="!isActive(i)">
                        <span class="text-xs sm:text-sm font-semibold text-white tracking-wider uppercase">
                          {{ item.subtitle }}
                        </span>
                      </div>
                    }

                    @if (item.title) {
                      <h3 class="text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-black leading-[0.9] mb-4 sm:mb-6 text-white transform transition-all duration-700 delay-200"
                          [class.translate-y-0]="isActive(i)"
                          [class.translate-y-12]="!isActive(i)"
                          [class.opacity-100]="isActive(i)"
                          [class.opacity-0]="!isActive(i)">
                        {{ item.title }}
                      </h3>
                    }

                    @if (item.description) {
                      <p class="text-white/95 mb-6 sm:mb-8 text-sm sm:text-base lg:text-lg xl:text-xl leading-relaxed font-medium max-w-xl transform transition-all duration-700 delay-300"
                         [class.translate-y-0]="isActive(i)"
                         [class.translate-y-8]="!isActive(i)"
                         [class.opacity-100]="isActive(i)"
                         [class.opacity-0]="!isActive(i)"
                         style="text-shadow: 0 2px 8px rgba(0,0,0,0.4);">
                        {{ item.description }}
                      </p>
                    }

                    @if (item.buttonText) {
                      <div class="transform transition-all duration-700 delay-400"
                           [class.translate-y-0]="isActive(i)"
                           [class.translate-y-8]="!isActive(i)"
                           [class.opacity-100]="isActive(i)"
                           [class.opacity-0]="!isActive(i)">

                        <button
                          class="px-6 sm:px-8 py-3 sm:py-4 bg-white text-gray-900 rounded-2xl font-bold text-sm sm:text-base shadow-xl hover:shadow-2xl transform hover:scale-105 active:scale-95 transition-all duration-300"
                          (click)="onButtonClick(item)">

                          <span class="flex items-center gap-2">
                            {{ item.buttonText }}
                            <svg class="w-4 h-4 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 8l4 4m0 0l-4 4m4-4H3"/>
                            </svg>
                          </span>
                        </button>
                      </div>
                    }
                  </div>
                </div>
              }
            </div>
          }
        </div>

        <!-- Indicadores modernos -->
        <div class="absolute bottom-6 left-1/2 transform -translate-x-1/2 flex items-center gap-3 z-20">
          @for (item of newsItems; track item.id; let i = $index) {
            <button
              class="group relative transition-all duration-500 ease-out"
              [class.scale-110]="i === currentIndex"
              (click)="goToSlide(i)"
              [attr.aria-label]="'Ir a la noticia ' + (i + 1)">
              
              <!-- Indicador principal -->
              <div class="relative overflow-hidden rounded-full transition-all duration-500"
                   [class.w-12]="i === currentIndex"
                   [class.w-3]="i !== currentIndex"
                   [class.h-3]="true">
                
                <!-- Fondo del indicador -->
                <div class="absolute inset-0 rounded-full transition-all duration-500"
                     [class.bg-white]="i === currentIndex"
                     [class.bg-white/40]="i !== currentIndex">
                </div>
                
                <!-- Brillo animado para el activo -->
                <div class="absolute inset-0 rounded-full transition-all duration-500"
                     [class.bg-gradient-to-r]="i === currentIndex"
                     [class.from-white/60]="i === currentIndex"
                     [class.via-white]="i === currentIndex"
                     [class.to-white/60]="i === currentIndex"
                     [class.opacity-100]="i === currentIndex"
                     [class.opacity-0]="i !== currentIndex">
                </div>
              </div>
              
              <!-- Efecto de hover -->
              <div class="absolute inset-0 rounded-full bg-white/20 scale-150 opacity-0 group-hover:opacity-100 group-hover:scale-200 transition-all duration-300"></div>
            </button>
          }
        </div>

        <!-- Botones de navegación modernos -->
        <button
          class="group absolute left-3 sm:left-6 bottom-4 top-auto translate-y-0 sm:bottom-auto sm:top-1/2 sm:-translate-y-1/2 w-11 h-11 sm:w-14 sm:h-14 bg-white/10 backdrop-blur-xl border border-white/20 text-white rounded-2xl flex items-center justify-center hover:bg-white/20 hover:border-white/40 transition-all duration-500 hover:scale-110 active:scale-95 z-20 touch-manipulation"
          (click)="previousSlide()"
          [attr.aria-label]="'Noticia anterior'"
          [class.opacity-0]="newsItems.length <= 1"
          [class.pointer-events-none]="newsItems.length <= 1">
          
          <!-- Icono con animación -->
          <svg class="w-5 h-5 sm:w-6 sm:h-6 transition-transform group-hover:-translate-x-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2.5">
            <path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7"></path>
          </svg>
          
          <!-- Efecto de brillo -->
          <div class="absolute inset-0 rounded-2xl bg-gradient-to-r from-white/0 via-white/10 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></div>
        </button>

        <button
          class="group absolute right-3 sm:right-6 bottom-4 top-auto translate-y-0 sm:bottom-auto sm:top-1/2 sm:-translate-y-1/2 w-11 h-11 sm:w-14 sm:h-14 bg-white/10 backdrop-blur-xl border border-white/20 text-white rounded-2xl flex items-center justify-center hover:bg-white/20 hover:border-white/40 transition-all duration-500 hover:scale-110 active:scale-95 z-20 touch-manipulation"
          (click)="nextSlide()"
          [attr.aria-label]="'Siguiente noticia'"
          [class.opacity-0]="newsItems.length <= 1"
          [class.pointer-events-none]="newsItems.length <= 1">
          
          <!-- Icono con animación -->
          <svg class="w-5 h-5 sm:w-6 sm:h-6 transition-transform group-hover:translate-x-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2.5">
            <path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7"></path>
          </svg>
          
          <!-- Efecto de brillo -->
          <div class="absolute inset-0 rounded-2xl bg-gradient-to-r from-white/0 via-white/10 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></div>
        </button>
      </div>

      <!-- Información adicional para mobile -->
      <div class="block sm:hidden mt-6 px-4">
        <div class="text-center">
          <div class="inline-flex items-center px-4 py-2 bg-white/10 backdrop-blur-md rounded-full border border-white/20">
            <span class="text-sm font-medium text-gray-700">
              {{ currentIndex + 1 }} de {{ newsItems.length }}
            </span>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    /* Animaciones personalizadas mejoradas */
    @keyframes slideInRight {
      from {
        transform: translateX(100px);
        opacity: 0;
      }
      to {
        transform: translateX(0);
        opacity: 1;
      }
    }

    @keyframes shimmer {
      0% { transform: translateX(-100%); }
      100% { transform: translateX(100%); }
    }

    @keyframes float {
      0%, 100% { transform: translateY(0px); }
      50% { transform: translateY(-10px); }
    }

    @keyframes pulse-glow {
      0%, 100% { 
        box-shadow: 0 0 20px rgba(255, 255, 255, 0.1);
        transform: scale(1);
      }
      50% { 
        box-shadow: 0 0 40px rgba(255, 255, 255, 0.2);
        transform: scale(1.02);
      }
    }

    /* Efectos avanzados */
    .slide-in-active {
      animation: slideInRight 0.7s ease-out;
    }

    .clip-path-transition {
      transition: clip-path 0.8s cubic-bezier(0.4, 0, 0.2, 1);
    }

    /* Efectos de vidrio mejorados */
    .glass-morphism {
      backdrop-filter: blur(20px);
      -webkit-backdrop-filter: blur(20px);
      background: rgba(255, 255, 255, 0.1);
      border: 1px solid rgba(255, 255, 255, 0.2);
    }

    /* Mejoras de texto */
    .text-enhanced {
      text-rendering: optimizeLegibility;
      -webkit-font-smoothing: antialiased;
      -moz-osx-font-smoothing: grayscale;
    }

    /* Line clamp mejorado */
    .line-clamp-3 {
      display: -webkit-box;
      -webkit-line-clamp: 3;
      -webkit-box-orient: vertical;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    /* Estados de focus mejorados */
    button:focus-visible {
      outline: 3px solid rgba(255, 255, 255, 0.8);
      outline-offset: 3px;
      border-radius: 12px;
    }

    /* Animaciones de hover suaves */
    .hover-lift {
      transition: transform 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94);
    }

    .hover-lift:hover {
      transform: translateY(-2px);
    }

    /* Efectos de brillo */
    .shine-effect {
      position: relative;
      overflow: hidden;
    }

    .shine-effect::after {
      content: '';
      position: absolute;
      top: 0;
      left: -100%;
      width: 100%;
      height: 100%;
      background: linear-gradient(
        90deg,
        transparent,
        rgba(255, 255, 255, 0.2),
        transparent
      );
      transition: left 0.5s;
    }

    .shine-effect:hover::after {
      left: 100%;
    }

    /* Optimización para dispositivos táctiles */
    @media (hover: none) and (pointer: coarse) {
      .hover\\:scale-105:hover {
        transform: scale(1.02);
      }
      
      .hover\\:bg-white\\/20:hover {
        background-color: rgba(255, 255, 255, 0.15);
      }
    }

    /* Responsive mejorado */
    @media (max-width: 640px) {
      .line-clamp-3 {
        -webkit-line-clamp: 2;
      }
      
      /* Reducir padding en móviles */
      .responsive-padding {
        padding: 1rem;
      }
    }

    /*
      Se quitaron los overrides de .max-w-xs (70% / 65% del ancho): recortaban la
      columna de texto en mobile y el título/descripción se partían en muchas
      líneas hasta desbordar el slide. El ancho ahora lo manejan las clases
      max-w-none / sm:max-w-sm del template.
    */
    @media (max-width: 480px) {
      /* Títulos más pequeños en móviles */
      .responsive-title {
        font-size: 1.5rem;
        line-height: 1.2;
      }
    }

    /* Mejoras de rendimiento */
    .gpu-accelerated {
      transform: translateZ(0);
      -webkit-transform: translateZ(0);
      will-change: transform;
    }

    /* Dark mode compatibility */
    @media (prefers-color-scheme: dark) {
      .auto-dark-text {
        color: rgba(255, 255, 255, 0.9);
      }
    }

    /* Reducir movimiento para usuarios sensibles */
    @media (prefers-reduced-motion: reduce) {
      * {
        animation-duration: 0.01ms !important;
        animation-iteration-count: 1 !important;
        transition-duration: 0.01ms !important;
      }
    }
  `]
})
export class NewsCarouselComponent implements OnInit, OnDestroy, AfterViewInit, OnChanges {
  @Input() newsItems: NewsItem[] = [];
  @Input() autoPlayInterval: number = 3000; // 3 segundos por defecto
  @Input() enableAutoPlay: boolean = true;

  currentIndex = 0;
  private autoPlayTimer?: any;
  private isBrowser: boolean;
  private touchStartX = 0;
  private touchEndX = 0;

  constructor(
    @Inject(PLATFORM_ID) private platformId: Object,
    private cdr: ChangeDetectorRef
  ) {
    this.isBrowser = isPlatformBrowser(this.platformId);
  }

  ngOnInit(): void {
    // Component initialization
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['newsItems'] && this.newsItems.length > 0) {
      setTimeout(() => {
        this.initializeAutoPlay();
      }, 500);
    }
  }

  ngAfterViewInit(): void {
    setTimeout(() => {
      this.initializeAutoPlay();
    }, 1000);
  }

  ngOnDestroy(): void {
    this.stopAutoPlay();
  }

  private initializeAutoPlay(): void {
    if (this.enableAutoPlay && this.newsItems.length > 1) {
      this.startAutoPlay();
    }
  }

  isActive(index: number): boolean {
    return index === this.currentIndex;
  }

  nextSlide(): void {
    this.currentIndex = (this.currentIndex + 1) % this.newsItems.length;
    this.cdr.detectChanges();
  }

  previousSlide(): void {
    this.stopAutoPlay();
    this.currentIndex = this.currentIndex === 0 ? this.newsItems.length - 1 : this.currentIndex - 1;
    this.cdr.detectChanges();
    if (this.enableAutoPlay) {
      setTimeout(() => {
        this.startAutoPlay();
      }, 2000);
    }
  }

  goToSlide(index: number): void {
    this.stopAutoPlay();
    this.currentIndex = index;
    this.cdr.detectChanges();
    if (this.enableAutoPlay) {
      setTimeout(() => {
        this.startAutoPlay();
      }, 2000);
    }
  }

  onButtonClick(item: NewsItem): void {
    if (item.buttonAction) {
      item.buttonAction();
    }
  }

  getPatternId(index: number): string {
    return `pattern-${index}`;
  }

  getPatternUrl(index: number): string {
    return `url(#pattern-${index})`;
  }

  startAutoPlay(): void {
    if (this.newsItems.length <= 1) {
      return;
    }
    
    this.stopAutoPlay();
    this.autoPlayTimer = setInterval(() => {
      this.nextSlide();
    }, this.autoPlayInterval);
  }

  stopAutoPlay(): void {
    if (this.autoPlayTimer) {
      clearInterval(this.autoPlayTimer);
      this.autoPlayTimer = undefined;
    }
  }


  // Métodos para manejar gestos touch
  onTouchStart(event: TouchEvent): void {
    this.touchStartX = event.changedTouches[0].screenX;
  }

  onTouchMove(event: TouchEvent): void {
    // Prevenir scroll vertical mientras se hace swipe horizontal
    if (Math.abs(event.changedTouches[0].screenX - this.touchStartX) > 10) {
      event.preventDefault();
    }
  }

  onTouchEnd(event: TouchEvent): void {
    this.touchEndX = event.changedTouches[0].screenX;
    this.handleSwipe();
  }

  private handleSwipe(): void {
    const swipeThreshold = 50; // Mínimo de píxeles para considerar un swipe
    const swipeDistance = this.touchStartX - this.touchEndX;

    if (Math.abs(swipeDistance) > swipeThreshold) {
      if (swipeDistance > 0) {
        // Swipe hacia la izquierda - siguiente slide
        this.nextSlide();
      } else {
        // Swipe hacia la derecha - slide anterior
        this.previousSlide();
      }
    }
  }

}
