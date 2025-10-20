import { Component, Input, Output, EventEmitter, OnInit, OnDestroy, OnChanges, ElementRef, Renderer2 } from '@angular/core';
import { CommonModule } from '@angular/common';
import { trigger, state, style, transition, animate } from '@angular/animations';

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
  animations: [
    trigger('modalAnimation', [
      state('void', style({
        opacity: 0,
        transform: 'scale(0.8) translateY(-50px)'
      })),
      state('*', style({
        opacity: 1,
        transform: 'scale(1) translateY(0)'
      })),
      transition('void => *', animate('300ms cubic-bezier(0.4, 0, 0.2, 1)')),
      transition('* => void', animate('200ms cubic-bezier(0.4, 0, 0.2, 1)'))
    ])
  ],
  template: `
    <!-- El modal se renderiza directamente en el body via código -->
  `,
  styles: [`
    /* Portal del modal - posicionamiento absoluto en viewport */
    .modal-portal {
      position: fixed !important;
      top: 0 !important;
      left: 0 !important;
      width: 100vw !important;
      height: 100vh !important;
      background: rgba(0, 0, 0, 0.5) !important;
      backdrop-filter: blur(4px);
      z-index: 999999 !important;
      
      /* Centrado perfecto con CSS Grid */
      display: grid !important;
      place-items: center !important;
      
      /* Padding para evitar que toque los bordes */
      padding: 1rem !important;
      box-sizing: border-box !important;
      
      /* Scroll interno si es necesario */
      overflow-y: auto !important;
    }
    
    /* Contenedor del modal */
    .modal-content {
      background: white !important;
      border-radius: 1.5rem !important;
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25) !important;
      width: 100% !important;
      max-width: 28rem !important;
      max-height: calc(100vh - 2rem) !important;
      overflow-y: auto !important;
      position: relative !important;
      margin: auto !important;
    }
    
    /* Asegurar que el host no interfiera */
    :host {
      position: fixed !important;
      top: 0 !important;
      left: 0 !important;
      width: 100vw !important;
      height: 100vh !important;
      pointer-events: none !important;
      z-index: 999999 !important;
    }
    
    :host(.modal-visible) {
      pointer-events: auto !important;
    }
    
    /* Mejoras de accesibilidad */
    button:focus {
      outline: 2px solid rgba(59, 130, 246, 0.5);
      outline-offset: 2px;
    }
    
    /* Responsive para diferentes tamaños */
    @media (min-width: 768px) {
      .modal-content {
        max-width: 32rem !important;
      }
    }
    
    @media (min-width: 1024px) {
      .modal-content {
        max-width: 36rem !important;
      }
    }
    
    @media (max-width: 640px) {
      .modal-portal {
        padding: 0.5rem !important;
      }
      
      .modal-content {
        max-height: calc(100vh - 1rem) !important;
      }
      
      .h-64 {
        height: 12rem;
      }
    }
    
    /* Prevenir cualquier interferencia */
    .modal-portal * {
      box-sizing: border-box;
    }
  `],
})
export class FilialModalComponent implements OnInit, OnDestroy, OnChanges {
  @Input() filial: FilialModalData | null = null;
  @Input() isVisible: boolean = false;
  @Output() closeModalEvent = new EventEmitter<void>();

  private modalElement: HTMLElement | null = null;

  constructor(
    private elementRef: ElementRef,
    private renderer: Renderer2
  ) {}

  ngOnInit() {
    // Observar cambios en isVisible
    this.updateModal();
  }

  ngOnDestroy() {
    this.removeModal();
  }

  ngOnChanges() {
    this.updateModal();
  }

  private updateModal() {
    if (this.isVisible && !this.modalElement) {
      this.createModal();
    } else if (!this.isVisible && this.modalElement) {
      this.removeModal();
    }
  }

  private createModal() {
    // Crear el backdrop del modal
    this.modalElement = this.renderer.createElement('div');
    
    // Aplicar estilos inline para garantizar posicionamiento
    this.renderer.setStyle(this.modalElement, 'position', 'fixed');
    this.renderer.setStyle(this.modalElement, 'top', '0');
    this.renderer.setStyle(this.modalElement, 'left', '0');
    this.renderer.setStyle(this.modalElement, 'width', '100vw');
    this.renderer.setStyle(this.modalElement, 'height', '100vh');
    this.renderer.setStyle(this.modalElement, 'background', 'rgba(0, 0, 0, 0.5)');
    this.renderer.setStyle(this.modalElement, 'z-index', '999999');
    this.renderer.setStyle(this.modalElement, 'display', 'flex');
    this.renderer.setStyle(this.modalElement, 'align-items', 'center');
    this.renderer.setStyle(this.modalElement, 'justify-content', 'center');
    this.renderer.setStyle(this.modalElement, 'padding', '1rem');
    this.renderer.setStyle(this.modalElement, 'backdrop-filter', 'blur(4px)');

    // Crear el contenedor del modal
    const modalContent = this.renderer.createElement('div');
    this.renderer.setStyle(modalContent, 'background', 'white');
    this.renderer.setStyle(modalContent, 'border-radius', '1.5rem');
    this.renderer.setStyle(modalContent, 'box-shadow', '0 25px 50px -12px rgba(0, 0, 0, 0.25)');
    this.renderer.setStyle(modalContent, 'width', '100%');
    this.renderer.setStyle(modalContent, 'max-width', '28rem');
    this.renderer.setStyle(modalContent, 'max-height', '90vh');
    this.renderer.setStyle(modalContent, 'overflow-y', 'auto');

    // Crear el contenido HTML del modal
    modalContent.innerHTML = this.getModalHTML();

    // Agregar event listeners
    this.renderer.listen(this.modalElement, 'click', (event) => {
      if (event.target === this.modalElement) {
        this.closeModal();
      }
    });

    // Agregar listener al botón cerrar
    const closeButton = modalContent.querySelector('.close-modal-btn');
    if (closeButton) {
      this.renderer.listen(closeButton, 'click', () => {
        this.closeModal();
      });
    }

    // Ensamblar el modal
    this.renderer.appendChild(this.modalElement, modalContent);
    
    // Agregar al body
    this.renderer.appendChild(document.body, this.modalElement);
    
    // Prevenir scroll del body
    this.renderer.setStyle(document.body, 'overflow', 'hidden');
  }

  private removeModal() {
    if (this.modalElement) {
      this.renderer.removeChild(document.body, this.modalElement);
      this.modalElement = null;
      
      // Restaurar scroll del body
      this.renderer.setStyle(document.body, 'overflow', '');
    }
  }

  private getModalHTML(): string {
    return `
      <!-- Header con imagen -->
      <div style="position: relative; height: 16rem; overflow: hidden;">
        <img 
          src="${this.getImageUrl(this.filial?.imageUrl)}" 
          alt="${this.filial?.nombre}"
          style="width: 100%; height: 100%; object-fit: cover;"
          onerror="this.src='cirsublogo.png'">
        
        <!-- Overlay gradiente -->
        <div style="position: absolute; inset: 0; background: linear-gradient(to top, rgba(0,0,0,0.6), transparent, rgba(0,0,0,0.2));"></div>
        
        <!-- Botón cerrar -->
        <button 
          class="close-modal-btn"
          style="position: absolute; top: 1rem; right: 1rem; width: 2.5rem; height: 2.5rem; background: rgba(255,255,255,0.2); backdrop-filter: blur(12px); border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white; border: none; cursor: pointer; transition: all 0.2s;"
          onmouseover="this.style.background='rgba(255,255,255,0.3)'"
          onmouseout="this.style.background='rgba(255,255,255,0.2)'">
          <svg style="width: 1.5rem; height: 1.5rem;" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
          </svg>
        </button>
        
        <!-- Título sobre la imagen -->
        <div style="position: absolute; bottom: 1rem; left: 1rem; right: 1rem;">
          <h2 style="font-size: 1.5rem; font-weight: bold; color: white; margin-bottom: 0.25rem; text-shadow: 0 2px 8px rgba(0,0,0,0.8);">
            ${this.filial?.nombre || ''}
          </h2>
          <p style="color: rgba(255,255,255,0.9); font-size: 0.875rem; font-weight: 500; text-transform: uppercase; letter-spacing: 0.05em; text-shadow: 0 2px 8px rgba(0,0,0,0.6);">
            Filial
          </p>
        </div>
      </div>
      
      <!-- Contenido del modal -->
      <div style="padding: 1.5rem; space-y: 1.5rem;">
        
        <!-- Información de contacto -->
        <div style="display: flex; flex-direction: column; gap: 1rem;">
          
          ${this.filial?.direccion ? `
          <!-- Dirección -->
          <div style="display: flex; align-items: flex-start; gap: 1rem; padding: 1rem; background: #f9fafb; border-radius: 1rem; transition: background-color 0.2s;">
            <div style="flex-shrink: 0; width: 2.5rem; height: 2.5rem; background: #dbeafe; border-radius: 0.75rem; display: flex; align-items: center; justify-content: center;">
              <svg style="width: 1.25rem; height: 1.25rem; color: #2563eb;" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path>
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path>
              </svg>
            </div>
            <div style="flex: 1;">
              <h3 style="font-size: 0.875rem; font-weight: 600; color: #111827; margin-bottom: 0.25rem;">Dirección</h3>
              <p style="color: #374151; line-height: 1.6;">${this.filial?.direccion}</p>
            </div>
          </div>
          ` : ''}
          
          ${this.filial?.telefono ? `
          <!-- Teléfono -->
          <div style="display: flex; align-items: flex-start; gap: 1rem; padding: 1rem; background: #f9fafb; border-radius: 1rem; transition: background-color 0.2s;">
            <div style="flex-shrink: 0; width: 2.5rem; height: 2.5rem; background: #dcfce7; border-radius: 0.75rem; display: flex; align-items: center; justify-content: center;">
              <svg style="width: 1.25rem; height: 1.25rem; color: #16a34a;" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"></path>
              </svg>
            </div>
            <div style="flex: 1;">
              <h3 style="font-size: 0.875rem; font-weight: 600; color: #111827; margin-bottom: 0.25rem;">Teléfono</h3>
              <a href="tel:${this.filial?.telefono}" 
                 style="color: #16a34a; font-weight: 500; text-decoration: none; transition: color 0.2s;"
                 onmouseover="this.style.color='#15803d'"
                 onmouseout="this.style.color='#16a34a'">
                ${this.filial?.telefono}
              </a>
            </div>
          </div>
          ` : ''}
          
          ${this.filial?.email ? `
          <!-- Email -->
          <div style="display: flex; align-items: flex-start; gap: 1rem; padding: 1rem; background: #f9fafb; border-radius: 1rem; transition: background-color 0.2s;">
            <div style="flex-shrink: 0; width: 2.5rem; height: 2.5rem; background: #f3e8ff; border-radius: 0.75rem; display: flex; align-items: center; justify-content: center;">
              <svg style="width: 1.25rem; height: 1.25rem; color: #9333ea;" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path>
              </svg>
            </div>
            <div style="flex: 1;">
              <h3 style="font-size: 0.875rem; font-weight: 600; color: #111827; margin-bottom: 0.25rem;">Email</h3>
              <a href="mailto:${this.filial?.email}" 
                 style="color: #9333ea; font-weight: 500; text-decoration: none; transition: color 0.2s;"
                 onmouseover="this.style.color='#7c3aed'"
                 onmouseout="this.style.color='#9333ea'">
                ${this.filial?.email}
              </a>
            </div>
          </div>
          ` : ''}
          
          ${!this.filial?.direccion && !this.filial?.telefono && !this.filial?.email ? `
          <!-- Mensaje si no hay datos -->
          <div style="text-align: center; padding: 2rem 0;">
            <div style="width: 4rem; height: 4rem; background: #f3f4f6; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 1rem;">
              <svg style="width: 2rem; height: 2rem; color: #9ca3af;" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              </svg>
            </div>
            <p style="color: #6b7280; font-weight: 500;">Información de contacto no disponible</p>
          </div>
          ` : ''}
        </div>
        
        <!-- Botón de acción -->
        <div style="padding-top: 1.5rem; border-top: 1px solid #e5e7eb;">
          <button 
            class="close-modal-btn"
            style="width: 100%; background: linear-gradient(to right, #14b8a6, #0d9488); color: white; font-weight: 600; padding: 0.875rem 1.5rem; border-radius: 1rem; border: none; cursor: pointer; transition: all 0.3s; box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);"
            onmouseover="this.style.background='linear-gradient(to right, #0f766e, #0d9488)'; this.style.transform='scale(1.02)'; this.style.boxShadow='0 20px 25px -5px rgba(0, 0, 0, 0.1)'"
            onmouseout="this.style.background='linear-gradient(to right, #14b8a6, #0d9488)'; this.style.transform='scale(1)'; this.style.boxShadow='0 10px 15px -3px rgba(0, 0, 0, 0.1)'"
            onmousedown="this.style.transform='scale(0.98)'"
            onmouseup="this.style.transform='scale(1.02)'">
            Cerrar
          </button>
        </div>
      </div>
    `;
  }

  closeModal(): void {
    this.closeModalEvent.emit();
  }

  onBackdropClick(event: Event): void {
    if (event.target === event.currentTarget) {
      this.closeModal();
    }
  }

  onImageError(event: any): void {
    console.error('❌ Error cargando imagen:', event.target.src);
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
    return imageUrl;
  }
}
