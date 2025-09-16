import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface Sucursal {
  id: string;
  nombre: string;
  lat: number;
  lng: number;
  direccion?: string;
  telefono?: string;
  email?: string;
}

@Component({
  selector: 'app-argentina-map',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="argentina-map-container" [ngClass]="containerClass">
      <svg 
        [attr.width]="mapWidth" 
        [attr.height]="mapHeight" 
        [attr.viewBox]="'0 0 ' + mapWidth + ' ' + mapHeight"
        class="argentina-map-svg"
        (click)="onMapClick($event)">
        
        <!-- Mapa profesional de Argentina -->
        <g class="argentina-background">
          <image 
            href="https://airportmedia.aeropuertosargentina.com/assets/mapa_argentina-B8OxrHMv.svg" 
            x="0" 
            y="0" 
            [attr.width]="mapWidth" 
            [attr.height]="mapHeight"
            class="argentina-map-image"/>
        </g>
        
        <!-- Pines de sucursales (logos y pulsos) -->
        <g class="sucursales-layer">
          @for (sucursal of sucursales; track sucursal.id; let i = $index) {
            <g class="sucursal-pin"
               [attr.transform]="getTransform(sucursal)"
               [attr.data-sucursal-id]="sucursal.id">
            
            <!-- Efecto de pulso -->
            <circle r="20" 
                    fill="none" 
                    stroke="#00C768" 
                    stroke-width="2" 
                    opacity="0.8" 
                    class="pin-pulse"
                    [attr.id]="'pulse-' + sucursal.id">
              <animate attributeName="r" 
                       values="20;45" 
                       dur="2s" 
                       repeatCount="indefinite"
                       [attr.id]="'pulse-r-' + sucursal.id"/>
              <animate attributeName="opacity" 
                       values="0.8;0" 
                       dur="2s" 
                       repeatCount="indefinite"
                       [attr.id]="'pulse-o-' + sucursal.id"/>
            </circle>
            
            <!-- Logo de la empresa con eventos -->
            <g class="pin-logo-wrapper"
               (click)="onSucursalClick(sucursal)"
               (mouseenter)="showTooltip(sucursal.id)"
               (mouseleave)="hideTooltip(sucursal.id)">
              
              <!-- Área invisible para hover más amplia -->
              <circle r="25" 
                      fill="transparent" 
                      stroke="none" 
                      class="hover-area"/>
              
              <image [attr.href]="logoUrl" 
                     x="-20" 
                     y="-20" 
                     width="40" 
                     height="40" 
                     class="pin-logo"/>
            </g>
            </g>
          }
        </g>
        
        <!-- Tooltips - Grupo separado que se renderiza DESPUÉS (siempre encima) -->
        <g class="tooltips-layer">
          @for (sucursal of sucursales; track sucursal.id; let i = $index) {
            <g class="tooltip-container"
               [attr.transform]="getTransform(sucursal)">
            
            <g class="tooltip" 
               [attr.id]="'tooltip-' + sucursal.id"
               opacity="0" 
               [attr.transform]="getTooltipTransform(sucursal)">
              <rect x="0" y="0" 
                    width="320" 
                    height="95" 
                    fill="rgba(31, 41, 55, 0.95)" 
                    stroke="#00C768" 
                    stroke-width="2" 
                    rx="8" 
                    ry="8"/>
              
              <text x="15" y="20" 
                    fill="#ffffff" 
                    font-size="13" 
                    font-weight="bold">{{ sucursal.nombre }}</text>
              
              <text x="15" y="37" 
                    fill="#d1d5db" 
                    font-size="12">{{ sucursal.direccion || 'Dirección no disponible' }}</text>
              
              <text x="15" y="52" 
                    fill="#00C768" 
                    font-size="10">📍 {{ formatCoordinate(sucursal.lat) }}, {{ formatCoordinate(sucursal.lng) }}</text>
              
              <text x="15" y="67" 
                    fill="#60a5fa" 
                    font-size="10">📞 {{ sucursal.telefono || 'Tel. no disponible' }}</text>
              
              <text x="15" y="82" 
                    fill="#9ca3af" 
                    font-size="9">✉️ {{ sucursal.email || 'Email no disponible' }}</text>
            </g>
            </g>
          }
        </g>
        
        <!-- Leyenda opcional -->
        <!-- @if (showLegend) {
          <g class="legend" transform="translate(20, 20)">
            <rect width="200" height="70" fill="rgba(255, 255, 255, 0.95)" stroke="#00C768" stroke-width="2" rx="8"/>
            <text x="15" y="25" font-size="14" font-weight="bold" fill="#374151">{{ legendTitle }}</text>
            <circle cx="25" cy="45" r="8" fill="#00C768" stroke="#ffffff" stroke-width="2"/>
            <text x="45" y="50" font-size="12" fill="#6b7280">{{ sucursales.length }} ubicaciones</text>
          </g>
        } -->
      </svg>
    </div>
  `,
  styles: [`
    .argentina-map-container {
      display: flex;
      justify-content: center;
      align-items: center;
      width: 100%;
      margin: 20px 0;
    }

    .argentina-map-svg {
      max-width: 100%;
      height: auto;
      background: transparent;
    }

    .argentina-map-image {
      filter: drop-shadow(0 2px 6px rgba(0, 0, 0, 0.08));
    }

    .sucursal-pin {
      cursor: pointer;
      transition: none;
    }

    .pin-logo-wrapper {
      transform-origin: 0px 0px;
      transition: transform 0.2s ease-out;
      cursor: pointer;
    }

    .pin-logo {
      filter: drop-shadow(2px 2px 6px rgba(0, 0, 0, 0.3));
      transition: transform 0.2s ease-out, filter 0.2s ease-out;
    }

    .sucursal-pin:hover .pin-logo-wrapper {
      transform: scale(1.2);
    }

    .sucursal-pin:hover .pin-logo {
      filter: drop-shadow(0 4px 12px rgba(0, 199, 104, 0.6));
    }

    .pin-pulse {
      animation-timing-function: ease-in-out;
      transition: stroke-width 0.15s ease-out, opacity 0.15s ease-out;
      pointer-events: none;
    }

    .sucursal-pin:hover .pin-pulse {
      stroke: #00C768;
      stroke-width: 3;
      opacity: 0.9;
    }

    .tooltip {
      pointer-events: none;
      transition: opacity 0.3s ease;
    }

    .tooltip.show {
      opacity: 1 !important;
      transition: opacity 0.3s ease-in-out;
    }

    .tooltip rect {
      filter: drop-shadow(4px 4px 12px rgba(0, 0, 0, 0.6));
    }

    .hover-area {
      pointer-events: all;
    }

    .legend {
      pointer-events: none;
    }

    .legend rect {
      filter: drop-shadow(2px 2px 8px rgba(0, 0, 0, 0.15));
    }

    .legend text {
      font-family: 'Geist', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
    }

    /* Efectos adicionales personalizables */
    .map-glow {
      filter: drop-shadow(0 0 20px rgba(0, 199, 104, 0.3));
    }

    .map-blur {
      filter: blur(2px);
      transition: filter 0.3s ease;
    }

    .map-blur:hover {
      filter: blur(0px);
    }

    .map-sepia {
      filter: sepia(0.3);
    }

    .map-grayscale {
      filter: grayscale(0.2);
    }

    @media (max-width: 768px) {
      .argentina-map-container {
        margin: 10px 0;
      }
    }
  `]
})
export class ArgentinaMapComponent {
  // Propiedades de entrada
  @Input() sucursales: Sucursal[] = [];
  @Input() logoUrl: string = 'cirsub.png';
  @Input() showLegend: boolean = true;
  @Input() legendTitle: string = 'Sucursales en Argentina';
  @Input() containerClass: string = '';
  @Input() enableTooltips: boolean = true;
  @Input() enablePulse: boolean = true;

  // Eventos de salida
  @Output() sucursalClick = new EventEmitter<Sucursal>();
  @Output() mapClick = new EventEmitter<{x: number, y: number, lat: number, lng: number}>();

  // Configuración del mapa
  mapWidth = 530;
  mapHeight = 1087;

  private readonly bounds = {
    north: -21.8,
    south: -55.0,
    east: -53.6,
    west: -73.6
  };

  /**
   * Sistema de coordenadas calibradas exactas
   */
  convertCoordinates(lat: number, lng: number): { x: number, y: number } {
    const cityMap: { [key: string]: { x: number, y: number } } = {
      // COORDENADAS CALIBRADAS EXACTAS
      '-27.4804,-55.8267': { x: 452, y: 196 }, // Garupá 
      '-32.9442,-60.6505': { x: 303, y: 374 }, // Rosario
      '-38.0055,-57.5426': { x: 376, y: 540 }, // Mar del Plata
      '-34.6147,-58.3785': { x: 371, y: 434 }, // CABA - Sede Central
      '-34.5507,-58.6788': { x: 356, y: 425 }, // San Miguel GBA
      '-37.9909,-57.5468': { x: 376, y: 540 }, // Mar del Plata
      '-30.9804,-64.0924': { x: 192, y: 290 }, // Jesús María
      '-31.4103,-64.1892': { x: 180, y: 309 }, // Córdoba Capital
      '-27.4567,-59.0117': { x: 362, y: 178 }, // Resistencia
      '-27.4789,-58.8377': { x: 366, y: 191 }, // Corrientes Capital
      '-32.4831,-58.2284': { x: 373, y: 362 }, // Concepción del Uruguay
      '-26.4040,-54.6289': { x: 497, y: 163 }, // Eldorado
      '-27.4862,-55.1176': { x: 475, y: 200 }, // Oberá
      '-27.3859,-55.8948': { x: 453, y: 198 }, // Posadas
      '-26.1865,-58.1775': { x: 383, y: 148 }, // Formosa Capital
      '-23.1379,-64.3201': { x: 178, y: 46 },  // Orán
      '-24.7965,-65.4104': { x: 148, y: 97 },  // Salta Capital
      '-51.6208,-69.2437': { x: 98, y: 988 },  // Río Gallegos
      '-45.8624,-67.4898': { x: 129, y: 798 }, // Comodoro Rivadavia
      '-38.9548,-68.0525': { x: 104, y: 577 }, // Neuquén Capital
      '-32.8820,-68.8410': { x: 72, y: 383 },  // Mendoza Capital
      '-33.5726,-69.0125': { x: 64, y: 405 },  // Tunuyán
      '-31.5290,-68.5161': { x: 84, y: 329 }   // San Juan Capital
    };
    
    // Buscar coordenada exacta
    const key = `${lat.toFixed(4)},${lng.toFixed(4)}`;
    if (cityMap[key]) {
      return cityMap[key];
    }
    
    // Fallback a interpolación
    const latRange = this.bounds.north - this.bounds.south;
    const lngRange = this.bounds.east - this.bounds.west;
    
    const normalizedLat = (lat - this.bounds.south) / latRange;
    const normalizedLng = (lng - this.bounds.west) / lngRange;
    
    const margin = 20;
    const usableWidth = this.mapWidth - (2 * margin);
    const usableHeight = this.mapHeight - (2 * margin);
    
    const x = margin + (normalizedLng * usableWidth);
    const y = margin + ((1 - normalizedLat) * usableHeight);
    
    return { x: Math.round(x), y: Math.round(y) };
  }

  /**
   * Obtiene la transformación para posicionar una sucursal
   */
  getTransform(sucursal: Sucursal): string {
    const pos = this.convertCoordinates(sucursal.lat, sucursal.lng);
    return `translate(${pos.x}, ${pos.y})`;
  }

  /**
   * Calcula la posición inteligente del tooltip
   */
  getTooltipTransform(sucursal: Sucursal): string {
    const pos = this.convertCoordinates(sucursal.lat, sucursal.lng);
    
    const tooltipWidth = 320;
    const tooltipHeight = 95;
    const margin = 20;
    
    let offsetX = 35;
    let offsetY = -105;
    
    if (pos.x + tooltipWidth + margin > this.mapWidth) {
      offsetX = -(tooltipWidth + 35);
    }
    
    if (pos.y - tooltipHeight - margin < 0) {
      offsetY = 35;
    }
    
    if (pos.y + tooltipHeight + margin > this.mapHeight) {
      offsetY = -105;
    }
    
    if (pos.x - tooltipWidth - margin < 0) {
      offsetX = 35;
    }
    
    return `translate(${offsetX}, ${offsetY})`;
  }

  /**
   * Formatea las coordenadas para mostrar
   */
  formatCoordinate(coord: number): string {
    return coord.toFixed(4);
  }

  /**
   * Maneja el click en una sucursal
   */
  onSucursalClick(sucursal: Sucursal): void {
    this.sucursalClick.emit(sucursal);
  }

  /**
   * Maneja el click en el mapa
   */
  onMapClick(event: MouseEvent): void {
    const svg = event.currentTarget as SVGElement;
    const rect = svg.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width) * this.mapWidth;
    const y = ((event.clientY - rect.top) / rect.height) * this.mapHeight;
    
    // Convertir coordenadas SVG a geográficas (aproximado)
    const margin = 20;
    const usableWidth = this.mapWidth - (2 * margin);
    const usableHeight = this.mapHeight - (2 * margin);
    
    const normalizedX = (x - margin) / usableWidth;
    const normalizedY = 1 - ((y - margin) / usableHeight);
    
    const lat = this.bounds.south + (normalizedY * (this.bounds.north - this.bounds.south));
    const lng = this.bounds.west + (normalizedX * (this.bounds.east - this.bounds.west));
    
    this.mapClick.emit({ x: Math.round(x), y: Math.round(y), lat, lng });
  }

  /**
   * Muestra el tooltip
   */
  showTooltip(sucursalId: string): void {
    if (!this.enableTooltips) return;
    
    const tooltip = document.getElementById(`tooltip-${sucursalId}`);
    if (tooltip) {
      tooltip.classList.add('show');
      tooltip.setAttribute('opacity', '1');
    }
    this.speedUpPulse(sucursalId, '1s');
  }

  /**
   * Oculta el tooltip
   */
  hideTooltip(sucursalId: string): void {
    if (!this.enableTooltips) return;
    
    const tooltip = document.getElementById(`tooltip-${sucursalId}`);
    if (tooltip) {
      tooltip.classList.remove('show');
      tooltip.setAttribute('opacity', '0');
    }
    this.speedUpPulse(sucursalId, '2s');
  }

  /**
   * Controla la velocidad del pulso
   */
  private speedUpPulse(sucursalId: string, duration: string): void {
    if (!this.enablePulse) return;
    
    const pulseR = document.getElementById(`pulse-r-${sucursalId}`) as any;
    const pulseO = document.getElementById(`pulse-o-${sucursalId}`) as any;
    
    if (pulseR && pulseO) {
      pulseR.setAttribute('dur', duration);
      pulseO.setAttribute('dur', duration);
      pulseR.beginElement();
      pulseO.beginElement();
    }
  }
}