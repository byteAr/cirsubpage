import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface FilialModalData {
  id: string;
  nombre: string;
  imageUrl: string;
  direccion?: string;
  telefono?: string;
  email?: string;
}

@Component({
  selector: 'app-filial-modal',
  standalone: true,
  imports: [CommonModule],
  template: `
    <!-- Backdrop del modal -->
    <div 
      *ngIf="isVisible"
      class="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm z-50 flex items-center justify-center p-4 transition-opacity duration-300"
      (click)="onBackdropClick($event)">
      
      <!-- Contenedor del modal -->
      <div 
        class="bg-white rounded-3xl shadow-2xl max-w-sm sm:max-w-md lg:max-w-lg xl:max-w-xl w-full max-h-[90vh] overflow-y-auto transform transition-all duration-300"
        (click)="$event.stopPropagation()">
        
        <!-- Header con imagen -->
        <div class="relative h-64 overflow-hidden">
          <img 
            [src]="getImageUrl(filial?.imageUrl)" 
            [alt]="filial?.nombre"
            class="w-full h-full object-cover"
            (error)="onImageError($event)"
            (load)="onImageLoad($event)">
          
          <!-- Overlay gradiente -->
          <div class="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20"></div>
          
          <!-- Botón cerrar -->
          <button 
            class="absolute top-4 right-4 w-10 h-10 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center text-white hover:bg-white/30 transition-all duration-200"
            (click)="closeModal()"
            aria-label="Cerrar modal">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
            </svg>
          </button>
          
          <!-- Título sobre la imagen -->
          <div class="absolute bottom-4 left-4 right-4">
            <h2 class="text-2xl font-bold text-white mb-1" style="text-shadow: 0 2px 8px rgba(0,0,0,0.8);">
              {{ filial?.nombre }}
            </h2>
            <p class="text-white/90 text-sm font-medium uppercase tracking-wider" style="text-shadow: 0 2px 8px rgba(0,0,0,0.6);">
              Filial
            </p>
          </div>
        </div>
        
        <!-- Contenido del modal -->
        <div class="p-4 sm:p-6 lg:p-8 space-y-4 sm:space-y-6">
          
          <!-- Información de contacto -->
          <div class="space-y-4">
            
            <!-- Dirección -->
            @if (filial?.direccion) {
              <div class="flex items-start gap-3 sm:gap-4 p-3 sm:p-4 lg:p-5 bg-gray-50 rounded-2xl hover:bg-gray-100 transition-colors duration-200">
                <div class="flex-shrink-0 w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                  <svg class="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path>
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path>
                  </svg>
                </div>
                <div class="flex-1">
                  <h3 class="text-sm font-semibold text-gray-900 mb-1">Dirección</h3>
                  <p class="text-gray-700 leading-relaxed">{{ filial?.direccion }}</p>
                </div>
              </div>
            }
            
            <!-- Teléfono -->
            @if (filial?.telefono) {
              <div class="flex items-start gap-3 sm:gap-4 p-3 sm:p-4 lg:p-5 bg-gray-50 rounded-2xl hover:bg-gray-100 transition-colors duration-200">
                <div class="flex-shrink-0 w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
                  <svg class="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"></path>
                  </svg>
                </div>
                <div class="flex-1">
                  <h3 class="text-sm font-semibold text-gray-900 mb-1">Teléfono</h3>
                  <a href="tel:{{ filial?.telefono }}" 
                     class="text-green-600 hover:text-green-700 font-medium transition-colors duration-200">
                    {{ filial?.telefono }}
                  </a>
                </div>
              </div>
            }
            
            <!-- Email -->
            @if (filial?.email) {
              <div class="flex items-start gap-3 sm:gap-4 p-3 sm:p-4 lg:p-5 bg-gray-50 rounded-2xl hover:bg-gray-100 transition-colors duration-200">
                <div class="flex-shrink-0 w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center">
                  <svg class="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path>
                  </svg>
                </div>
                <div class="flex-1">
                  <h3 class="text-sm font-semibold text-gray-900 mb-1">Email</h3>
                  <a href="mailto:{{ filial?.email }}" 
                     class="text-purple-600 hover:text-purple-700 font-medium transition-colors duration-200">
                    {{ filial?.email }}
                  </a>
                </div>
              </div>
            }
            
            <!-- Mensaje si no hay datos -->
            @if (!filial?.direccion && !filial?.telefono && !filial?.email) {
              <div class="text-center py-8">
                <div class="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg class="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                  </svg>
                </div>
                <p class="text-gray-500 font-medium">Información de contacto no disponible</p>
              </div>
            }
          </div>
          
          <!-- Botón de acción -->
          <div class="pt-4 sm:pt-6 border-t border-gray-200">
            <button 
              class="w-full bg-gradient-to-r from-teal-500 to-teal-600 hover:from-teal-600 hover:to-teal-700 text-white font-semibold py-3 sm:py-4 px-6 rounded-2xl transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98] shadow-lg hover:shadow-xl text-sm sm:text-base"
              (click)="closeModal()">
              Cerrar
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    /* Animaciones para el modal */
    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }
    
    @keyframes slideIn {
      from { 
        opacity: 0;
        transform: scale(0.95) translateY(20px);
      }
      to { 
        opacity: 1;
        transform: scale(1) translateY(0);
      }
    }
    
    /* Evitar scroll del body cuando el modal está abierto */
    :host {
      display: block;
    }
    
    /* Mejoras de accesibilidad */
    button:focus {
      outline: 2px solid rgba(59, 130, 246, 0.5);
      outline-offset: 2px;
    }
    
    /* Efectos suaves */
    .transition-all {
      transition-property: all;
      transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
    }
    
    /* Responsive adjustments */
    @media (max-width: 640px) {
      .max-w-lg {
        max-width: calc(100vw - 2rem);
        margin: 1rem;
      }
      
      .p-6 {
        padding: 1.5rem;
      }
      
      .h-64 {
        height: 12rem;
      }
    }
  `],
})
export class FilialModalComponent {
  @Input() filial: FilialModalData | null = null;
  @Input() isVisible: boolean = false;
  @Output() closeModalEvent = new EventEmitter<void>();

  closeModal(): void {
    this.closeModalEvent.emit();
  }

  onBackdropClick(event: Event): void {
    // Solo cerrar si se hace click en el backdrop, no en el contenido
    if (event.target === event.currentTarget) {
      this.closeModal();
    }
  }

  onImageError(event: any): void {
    console.error('❌ Error cargando imagen:', event.target.src);
    console.error('❌ Filial actual:', this.filial);
    console.error('❌ URL original del servicio:', this.filial?.imageUrl);
    
    // Cambiar a imagen de fallback
    event.target.src = 'cirsublogo.png';
  }

  onImageLoad(event: any): void {
    console.log('✅ Imagen cargada exitosamente:', event.target.src);
  }

  getImageUrl(imageUrl: string | undefined): string {
    if (!imageUrl) {
      console.warn('⚠️ No hay imageUrl, usando fallback');
      return 'cirsublogo.png';
    }
    
    console.log('🔗 Imagen a cargar:', imageUrl);
    return imageUrl;
  }
}
