import { Component, Input } from '@angular/core';
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
    <div class="argentina-map-container">
      <svg 
        [attr.width]="width" 
        [attr.height]="height" 
        [attr.viewBox]="getViewBox()"
        class="argentina-map-svg">
        
        <!-- Mapa de Argentina SVG -->
        <g class="argentina-outline">
          <!-- Path simplificado del contorno de Argentina -->
          <path d="M 200 80 L 180 120 L 160 180 L 140 240 L 120 300 L 100 360 L 110 420 L 130 480 L 160 520 L 200 540 L 240 520 L 280 500 L 320 480 L 360 460 L 400 440 L 420 400 L 440 360 L 460 320 L 480 280 L 500 240 L 520 200 L 540 160 L 560 120 L 580 100 L 600 80 L 580 60 L 540 50 L 500 45 L 460 50 L 420 55 L 380 60 L 340 65 L 300 70 L 260 75 L 220 78 Z" 
                fill="#e5e7eb" 
                stroke="#374151" 
                stroke-width="2"
                class="country-path"/>
        </g>
        
        <!-- Pines de sucursales -->
        <g class="sucursales-layer">
          <g *ngFor="let sucursal of sucursales; let i = index" 
             class="sucursal-pin"
             [attr.transform]="getTransform(sucursal)"
             (click)="onSucursalClick(sucursal)">
            
            <!-- Pin principal -->
            <circle r="8" 
                    fill="#dc2626" 
                    stroke="#ffffff" 
                    stroke-width="2" 
                    class="pin-circle"/>
            
            <!-- Punto central del pin -->
            <circle r="3" 
                    fill="#ffffff" 
                    class="pin-center"/>
            
            <!-- Tooltip con información -->
            <g class="tooltip" [attr.opacity]="0">
              <rect x="15" y="-30" 
                    width="150" 
                    height="60" 
                    fill="#1f2937" 
                    stroke="#374151" 
                    stroke-width="1" 
                    rx="4" 
                    ry="4"/>
              
              <text x="20" y="-15" 
                    fill="#ffffff" 
                    font-size="12" 
                    font-weight="bold">{{ sucursal.nombre }}</text>
              
              <text x="20" y="-2" 
                    fill="#d1d5db" 
                    font-size="10">{{ sucursal.direccion || 'Dirección no disponible' }}</text>
              
              <text x="20" y="12" 
                    fill="#d1d5db" 
                    font-size="10">Lat: {{ formatCoordinate(sucursal.lat) }}, Lng: {{ formatCoordinate(sucursal.lng) }}</text>
            </g>
          </g>
        </g>
        
        <!-- Leyenda -->
        <g class="legend" transform="translate(20, 20)">
          <rect width="180" height="60" fill="rgba(255, 255, 255, 0.9)" stroke="#d1d5db" rx="4"/>
          <text x="10" y="20" font-size="14" font-weight="bold" fill="#374151">Sucursales</text>
          <circle cx="20" cy="35" r="6" fill="#dc2626" stroke="#ffffff" stroke-width="2"/>
          <text x="35" y="40" font-size="12" fill="#6b7280">{{ sucursales.length }} ubicaciones</text>
        </g>
      </svg>
    </div>
  `,
  styles: [`
    .argentina-map-container {
      display: flex;
      justify-content: center;
      align-items: center;
      width: 100%;
      padding: 20px;
      background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
      border-radius: 12px;
      box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
    }

    .argentina-map-svg {
      max-width: 100%;
      height: auto;
      border-radius: 8px;
      background: #ffffff;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
    }

    .country-path {
      transition: all 0.3s ease;
      filter: drop-shadow(2px 2px 4px rgba(0, 0, 0, 0.1));
    }

    .country-path:hover {
      fill: #f3f4f6;
      stroke: #1f2937;
    }

    .sucursal-pin {
      cursor: pointer;
      transition: all 0.2s ease;
    }

    .sucursal-pin:hover {
      transform: scale(1.2);
    }

    .sucursal-pin:hover .tooltip {
      opacity: 1 !important;
      transition: opacity 0.3s ease;
    }

    .pin-circle {
      filter: drop-shadow(2px 2px 4px rgba(0, 0, 0, 0.2));
      transition: all 0.2s ease;
    }

    .sucursal-pin:hover .pin-circle {
      fill: #b91c1c;
    }

    .tooltip {
      pointer-events: none;
      transition: opacity 0.3s ease;
    }

    .tooltip rect {
      filter: drop-shadow(2px 2px 4px rgba(0, 0, 0, 0.2));
    }

    .legend {
      pointer-events: none;
    }

    .legend rect {
      filter: drop-shadow(1px 1px 3px rgba(0, 0, 0, 0.1));
    }

    .legend text {
      font-family: 'Arial', sans-serif;
    }

    @media (max-width: 768px) {
      .argentina-map-container {
        padding: 10px;
      }
    }
  `]
})
export class ArgentinaMapComponent {
  @Input() sucursales: Sucursal[] = [];
  @Input() width: number = 800;
  @Input() height: number = 600;

  // Límites geográficos de Argentina para la conversión de coordenadas
  private readonly bounds = {
    north: -21.780,
    south: -55.061,
    east: -53.628,
    west: -73.583
  };

  getViewBox(): string {
    return `0 0 ${this.width} ${this.height}`;
  }

  /**
   * Convierte coordenadas geográficas (lat, lng) a coordenadas SVG (x, y)
   */
  convertCoordinates(lat: number, lng: number): { x: number, y: number } {
    // Normalizar las coordenadas a un rango de 0 a 1
    const normalizedLat = (lat - this.bounds.south) / (this.bounds.north - this.bounds.south);
    const normalizedLng = (lng - this.bounds.west) / (this.bounds.east - this.bounds.west);
    
    // Convertir a coordenadas SVG considerando un margen
    const margin = 50;
    const mapWidth = this.width - (margin * 2);
    const mapHeight = this.height - (margin * 2);
    
    return {
      x: margin + (normalizedLng * mapWidth),
      y: margin + ((1 - normalizedLat) * mapHeight) // Invertir Y porque SVG tiene origen arriba
    };
  }

  /**
   * Obtiene la transformación para posicionar una sucursal
   */
  getTransform(sucursal: Sucursal): string {
    const pos = this.convertCoordinates(sucursal.lat, sucursal.lng);
    return `translate(${pos.x}, ${pos.y})`;
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
    console.log('Sucursal clickeada:', sucursal);
  }
}