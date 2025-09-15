import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

interface Sucursal {
  id: string;
  nombre: string;
  lat: number;
  lng: number;
  direccion?: string;
  telefono?: string;
  email?: string;
}

@Component({
  selector: 'app-filiales',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './filiales.html',
  styleUrl: './filiales.css'
})
export class Filiales {
  
  // Datos de ejemplo de sucursales con coordenadas reales de Argentina
  sucursales: Sucursal[] = [
    {
      id: '1',
      nombre: 'Sede Central',
      lat: -34.61470426072759,
      lng: -58.378521311634486,
      direccion: 'Tacuari 566 C.A.B.A',
      telefono: '+54 11 4000-0001',
      email: 'central@empresa.com'
    },
    {
      id: '2',
      nombre: 'Filial San Miguel (GBA)',
      lat: -34.55074238173547,
      lng: -58.67877004111912,
      direccion: 'Olegario Victor Andrade 640',
      telefono: '+54 11 4000-0002',
      email: 'sanmiguel@empresa.com'
    },
    
    {
      id: '3',
      nombre: 'Filial Mar del Plata (Pcia Bs As)',
      lat: -37.99094447537785,
      lng: -57.5468187116492,
      direccion: 'Av.Libertad 3046',
      telefono: '+54 223 400-0003',
      email: 'mardelplata@empresa.com'
    },
    {
      id: '4',
      nombre: 'Filial Jesús Maria (Córdoba)',
      lat: -30.980415700852355,
      lng: -64.09242823927357,
      direccion: 'Sarmiento 188',
      telefono: '+54 3525 400-0004',
      email: 'jesusmaria@empresa.com'
    },
    {
      id: '5',
      nombre: 'Filial Córdoba Capital',
      lat: -31.410326776754168,
      lng: -64.1891752932526,
      direccion: 'Santa Rosa 496',
      telefono: '+54 351 400-0005',
      email: 'cordobacapital@empresa.com'
    },
    {
      id: '6',
      nombre: 'Filial Resistencia (Chaco)',
      lat: -27.456722033348253,
      lng: -59.01173230859293,
      direccion: 'Giachino 1771',
      telefono: '+54 362 400-0006',
      email: 'resistencia@empresa.com'
    },
    {
      id: '7',
      nombre: 'Filial Corrientes Capital',
      lat: -27.47888912541209,
      lng: -58.83773730674739,
      direccion: 'Necochea 1145',
      telefono: '+54 379 400-0007',
      email: 'corrientes@empresa.com'
    },
    {
      id: '8',
      nombre: 'Filial Concepción del Uruguay (Entre Ríos)',
      lat: -32.48314767011576,
      lng: -58.22841853373691,
      direccion: 'Gral. Galarza 471',
      telefono: '+54 3442 400-0008',
      email: 'concepcion@empresa.com'
    },
    {
      id: '9',
      nombre: 'Filial Eldorado (Misiones)',
      lat: -26.403960322265196,
      lng: -54.628934806747374,
      direccion: 'Av.San Martín 306',
      telefono: '+54 3751 400-0009',
      email: 'eldorado@empresa.com'
    },
    {
      id: '10',
      nombre: 'Filial Oberá (Misiones)',
      lat: -27.48618197438306,
      lng: -55.11758549325262,
      direccion: 'Av. Libertad 178',
      telefono: '+54 3755 400-0010',
      email: 'obera@empresa.com'
    },
    {
      id: '11',
      nombre: 'Filial Posadas (Misiones)',
      lat: -27.385898313844375,
      lng: -55.89477199325261,
      direccion: 'San Marcos 3946',
      telefono: '+54 376 400-0011',
      email: 'posadas@empresa.com'
    },
    {
      id: '12',
      nombre: 'Filial Formosa Capital',
      lat: -26.186464609222195,
      lng: -58.17750866686845,
      direccion: '25 de Mayo 1158',
      telefono: '+54 370 400-0012',
      email: 'formosa@empresa.com'
    },
    {
      id: '13',
      nombre: 'Filial Orán (Salta)',
      lat: -23.137911653278636,
      lng: -64.32012312208771,
      direccion: 'Gral. Lavalle 60',
      telefono: '+54 3878 400-0013',
      email: 'oran@empresa.com'
    },
    {
      id: '14',
      nombre: 'Filial Salta Capital',
      lat: -24.79652469557382,
      lng: -65.41035800674737,
      direccion: 'Buenos Aires 530',
      telefono: '+54 387 400-0014',
      email: 'salta@empresa.com'
    },
    {
      id: '15',
      nombre: 'Filial Río Gallegos (Santa Cruz)',
      lat: -51.62079370821302,
      lng: -69.24367738213539,
      direccion: 'Lavalle 989',
      telefono: '+54 2966 400-0015',
      email: 'riogallegos@empresa.com'
    },
    {
      id: '16',
      nombre: 'Filial Comodoro Rivadavia (Chubut)',
      lat: -45.86238605123255,
      lng: -67.48981853742802,
      direccion: 'Av. Rivadavia 1028',
      telefono: '+54 297 400-0016',
      email: 'comodoro@empresa.com'
    },
    {
      id: '17',
      nombre: 'Filial Neuquén Capital',
      lat: -38.954820535237616,
      lng: -68.05248846441754,
      direccion: 'Independencia 470',
      telefono: '+54 299 400-0017',
      email: 'neuquen@empresa.com'
    },
    {
      id: '18',
      nombre: 'Filial Mendoza Capital',
      lat: -32.88204774558728,
      lng: -68.84102426441753,
      direccion: 'Patricias Mendocinas 1785',
      telefono: '+54 261 400-0018',
      email: 'mendoza@empresa.com'
    },
    {
      id: '19',
      nombre: 'Filial Tunuyán (Mendoza)',
      lat: -33.57261238748661,
      lng: -69.01251979325262,
      direccion: 'Leandro N. Alem & 9 de Julio',
      telefono: '+54 2622 400-0019',
      email: 'tunuyan@empresa.com'
    },
    {
      id: '20',
      nombre: 'Filial San Juan Capital',
      lat: -31.52899512932885,
      lng: -68.51606179017159,
      direccion: 'Av. Guillermo Rawson Norte 344',
      telefono: '+54 264 400-0020',
      email: 'sanjuan@empresa.com'
    }
  ];

  // Configuración basada en el SVG real de AirportMedia
  mapWidth = 530;   // Dimensiones del SVG real
  mapHeight = 1087;
  
  // Límites reales de Argentina
  private readonly bounds = {
    north: -21.8,   // Norte (Jujuy)
    south: -55.0,   // Sur (Tierra del Fuego)
    east: -53.6,    // Este (Misiones)
    west: -73.6     // Oeste (Mendoza/Catamarca)
  };

  // Sistema de calibración interactivo
  calibrationMode = false;
  currentCityToCalibrate: string | null = null;

  // Control de visualización de cards en móviles
  showAllCards = false;
  readonly MOBILE_CARDS_LIMIT = 4;
  cityCalibrationList = [
    { name: 'Sede Central (CABA)', lat: -34.61470426072759, lng: -58.378521311634486 },
    { name: 'San Miguel (GBA)', lat: -34.55074238173547, lng: -58.67877004111912 },
    { name: 'Mar del Plata', lat: -37.99094447537785, lng: -57.5468187116492 },
    { name: 'Jesús María (Córdoba)', lat: -30.980415700852355, lng: -64.09242823927357 },
    { name: 'Córdoba Capital', lat: -31.410326776754168, lng: -64.1891752932526 },
    { name: 'Resistencia (Chaco)', lat: -27.456722033348253, lng: -59.01173230859293 },
    { name: 'Corrientes Capital', lat: -27.47888912541209, lng: -58.83773730674739 },
    { name: 'Concepción del Uruguay', lat: -32.48314767011576, lng: -58.22841853373691 },
    { name: 'Eldorado (Misiones)', lat: -26.403960322265196, lng: -54.628934806747374 },
    { name: 'Oberá (Misiones)', lat: -27.48618197438306, lng: -55.11758549325262 },
    { name: 'Posadas (Misiones)', lat: -27.385898313844375, lng: -55.89477199325261 },
    { name: 'Formosa Capital', lat: -26.186464609222195, lng: -58.17750866686845 },
    { name: 'Orán (Salta)', lat: -23.137911653278636, lng: -64.32012312208771 },
    { name: 'Salta Capital', lat: -24.79652469557382, lng: -65.41035800674737 },
    { name: 'Río Gallegos (Santa Cruz)', lat: -51.62079370821302, lng: -69.24367738213539 },
    { name: 'Comodoro Rivadavia', lat: -45.86238605123255, lng: -67.48981853742802 },
    { name: 'Neuquén Capital', lat: -38.954820535237616, lng: -68.05248846441754 },
    { name: 'Mendoza Capital', lat: -32.88204774558728, lng: -68.84102426441753 },
    { name: 'Tunuyán (Mendoza)', lat: -33.57261238748661, lng: -69.01251979325262 },
    { name: 'San Juan Capital', lat: -31.52899512932885, lng: -68.51606179017159 }
  ];

  /**
   * Convierte coordenadas geográficas (lat, lng) a coordenadas SVG (x, y)
   * Sistema de proyección lineal simple pero preciso para Argentina
   */
  convertCoordinates(lat: number, lng: number): { x: number, y: number } {
    // Coordenadas CALIBRADAS basadas en puntos de referencia reales del SVG
    // Garupá: (452, 196), Rosario: (303, 374), Mar del Plata: (376, 540)
    const cityMap: { [key: string]: { x: number, y: number } } = {
      // PUNTOS DE REFERENCIA CALIBRADOS EXACTOS
      '-27.4804,-55.8267': { x: 452, y: 196 }, // Garupá 
      '-32.9442,-60.6505': { x: 303, y: 374 }, // Rosario
      '-38.0055,-57.5426': { x: 376, y: 540 }, // Mar del Plata
      
      // COORDENADAS CALCULADAS GEOGRÁFICAMENTE PRECISAS:
      
      // CABA - Sede Central (CALIBRADO)
      '-34.6147,-58.3785': { x: 371, y: 434 },
      
      // San Miguel GBA (CALIBRADO)
      '-34.5507,-58.6788': { x: 356, y: 425 },
      
      // Mar del Plata (YA CALIBRADO)
      '-37.9909,-57.5468': { x: 376, y: 540 },
      
      // Jesús María (CALIBRADO)
      '-30.9804,-64.0924': { x: 192, y: 290 },
      
      // Córdoba Capital (CALIBRADO)
      '-31.4103,-64.1892': { x: 180, y: 309 },
      
      // Resistencia (CALIBRADO)
      '-27.4567,-59.0117': { x: 362, y: 178 },
      
      // Corrientes Capital (CALIBRADO)
      '-27.4789,-58.8377': { x: 366, y: 191 },
      
      // Concepción del Uruguay (CALIBRADO)
      '-32.4831,-58.2284': { x: 373, y: 362 },
      
      // Eldorado (CALIBRADO)
      '-26.4040,-54.6289': { x: 497, y: 163 },
      
      // Oberá (CALIBRADO)
      '-27.4862,-55.1176': { x: 475, y: 200 },
      
      // Posadas (CALIBRADO)
      '-27.3859,-55.8948': { x: 453, y: 198 },
      
      // Formosa Capital (CALIBRADO)
      '-26.1865,-58.1775': { x: 383, y: 148 },
      
      // Orán (CALIBRADO)
      '-23.1379,-64.3201': { x: 178, y: 46 },
      
      // Salta Capital (CALIBRADO)
      '-24.7965,-65.4104': { x: 148, y: 97 },
      
      // Río Gallegos (CALIBRADO)
      '-51.6208,-69.2437': { x: 98, y: 988 },
      
      // Comodoro Rivadavia (CALIBRADO)
      '-45.8624,-67.4898': { x: 129, y: 798 },
      
      // Neuquén Capital (CALIBRADO)
      '-38.9548,-68.0525': { x: 104, y: 577 },
      
      // Mendoza Capital (CALIBRADO)
      '-32.8820,-68.8410': { x: 72, y: 383 },
      
      // Tunuyán (CALIBRADO)
      '-33.5726,-69.0125': { x: 64, y: 405 },
      
      // San Juan Capital (CALIBRADO)
      '-31.5290,-68.5161': { x: 84, y: 329 }
    };
    
    // Buscar coordenada exacta
    const key = `${lat.toFixed(4)},${lng.toFixed(4)}`;
    if (cityMap[key]) {
      console.log(`🎯 ${lat.toFixed(4)}, ${lng.toFixed(4)} -> SVG: ${cityMap[key].x}, ${cityMap[key].y} (Exact)`);
      return cityMap[key];
    }
    
    // Para coordenadas no exactas, usar interpolación geográfica avanzada
    // Basada en los puntos de referencia calibrados: Garupá, Rosario, Mar del Plata
    
    // Puntos de referencia para interpolación
    const ref1 = { lat: -27.4804, lng: -55.8267, x: 452, y: 196 }; // Garupá (noreste)
    const ref2 = { lat: -32.9442, lng: -60.6505, x: 303, y: 374 }; // Rosario (centro-litoral)
    const ref3 = { lat: -38.0055, lng: -57.5426, x: 376, y: 540 }; // Mar del Plata (costa sur)
    
    // Calcular interpolación usando triangulación
    const d1 = Math.sqrt(Math.pow(lat - ref1.lat, 2) + Math.pow(lng - ref1.lng, 2));
    const d2 = Math.sqrt(Math.pow(lat - ref2.lat, 2) + Math.pow(lng - ref2.lng, 2));
    const d3 = Math.sqrt(Math.pow(lat - ref3.lat, 2) + Math.pow(lng - ref3.lng, 2));
    
    // Pesos inversamente proporcionales a la distancia
    const w1 = 1 / Math.max(d1, 0.01);
    const w2 = 1 / Math.max(d2, 0.01);
    const w3 = 1 / Math.max(d3, 0.01);
    const totalWeight = w1 + w2 + w3;
    
    // Coordenadas interpoladas
    const x = (ref1.x * w1 + ref2.x * w2 + ref3.x * w3) / totalWeight;
    const y = (ref1.y * w1 + ref2.y * w2 + ref3.y * w3) / totalWeight;
    
    // Limitar a los bounds del SVG
    const finalX = Math.max(10, Math.min(this.mapWidth - 10, x));
    const finalY = Math.max(10, Math.min(this.mapHeight - 10, y));
    
    console.log(`🎯 ${lat.toFixed(4)}, ${lng.toFixed(4)} -> SVG: ${Math.round(finalX)}, ${Math.round(finalY)} (Interpolated)`);
    
    return { x: Math.round(finalX), y: Math.round(finalY) };
  }

  /**
   * Obtiene la transformación para posicionar una sucursal
   */
  getTransform(sucursal: Sucursal): string {
    const pos = this.convertCoordinates(sucursal.lat, sucursal.lng);
    return `translate(${pos.x}, ${pos.y})`;
  }

  /**
   * Obtiene la transformación para posicionar el tooltip de manera inteligente
   */
  getTooltipTransform(sucursal: Sucursal): string {
    const pos = this.convertCoordinates(sucursal.lat, sucursal.lng);
    
    // Dimensiones del tooltip actualizadas
    const tooltipWidth = 320;
    const tooltipHeight = 95;
    const margin = 20;
    
    // Calcular posición para evitar que se corte
    let offsetX = 35; // Desplazamiento por defecto hacia la derecha
    let offsetY = -105; // Desplazamiento por defecto hacia arriba
    
    // Si está muy cerca del borde derecho, mostrar a la izquierda
    if (pos.x + tooltipWidth + margin > this.mapWidth) {
      offsetX = -(tooltipWidth + 35);
    }
    
    // Si está muy cerca del borde superior, mostrar hacia abajo
    if (pos.y - tooltipHeight - margin < 0) {
      offsetY = 35;
    }
    
    // Si está muy cerca del borde inferior, forzar hacia arriba
    if (pos.y + tooltipHeight + margin > this.mapHeight) {
      offsetY = -105;
    }
    
    // Si está muy cerca del borde izquierdo, forzar hacia la derecha
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
    console.log('Sucursal seleccionada:', sucursal);
    // Aquí puedes agregar lógica adicional como mostrar un modal, navegar a otra página, etc.
  }

  /**
   * Método para debug - mostrar todas las coordenadas calculadas
   */
  debugCoordinates(): void {
    console.log('=== DEBUG: Coordenadas de Sucursales ===');
    console.log('Límites del mapa:', this.bounds);
    console.log('Dimensiones SVG:', { width: this.mapWidth, height: this.mapHeight });
    
    console.log('\n--- Sistema de coordenadas simplificado ---');
    
    console.log('\n--- Sucursales ---');
    this.sucursales.forEach(sucursal => {
      const coords = this.convertCoordinates(sucursal.lat, sucursal.lng);
      console.log(`${sucursal.nombre}:`, {
        geograficas: { lat: sucursal.lat, lng: sucursal.lng },
        svg: coords
      });
    });
  }

  /**
   * Función para ayudar a calibrar el mapa - mostrar coordenadas en click
   */
  onMapClick(event: MouseEvent): void {
    const svg = event.target as SVGElement;
    const rect = svg.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    
    // Escalar las coordenadas al viewBox del SVG
    const scaleX = this.mapWidth / rect.width;
    const scaleY = this.mapHeight / rect.height;
    const svgX = Math.round(x * scaleX);
    const svgY = Math.round(y * scaleY);
    
    if (this.calibrationMode && this.currentCityToCalibrate) {
      console.log(`🎯 Calibrando ${this.currentCityToCalibrate}: SVG(${svgX}, ${svgY})`);
      console.log(`Copia esto al código: '${this.getCityCoords(this.currentCityToCalibrate)}': { x: ${svgX}, y: ${svgY} },`);
      
      // Mostrar en pantalla también
      alert(`Calibración para ${this.currentCityToCalibrate}:\nSVG: ${svgX}, ${svgY}\n\nCopia al código:\n'${this.getCityCoords(this.currentCityToCalibrate)}': { x: ${svgX}, y: ${svgY} },`);
    } else {
      console.log(`Click en SVG: x=${svgX}, y=${svgY} (viewBox: ${this.mapWidth}x${this.mapHeight})`);
      console.log('Activa el modo calibración para calibrar ciudades específicas');
    }
  }

  toggleCalibrationMode(): void {
    this.calibrationMode = !this.calibrationMode;
    if (!this.calibrationMode) {
      this.currentCityToCalibrate = null;
    }
    console.log(`Modo calibración: ${this.calibrationMode ? 'ACTIVADO' : 'DESACTIVADO'}`);
  }

  selectCityToCalibrate(city: any): void {
    this.currentCityToCalibrate = city.name;
    console.log(`Ciudad seleccionada para calibrar: ${city.name} (${city.lat}, ${city.lng})`);
    console.log('Ahora haz click en el mapa donde debe estar esta ciudad');
  }

  private getCityCoords(cityName: string): string {
    const city = this.cityCalibrationList.find(c => c.name === cityName);
    return city ? `${city.lat.toFixed(4)},${city.lng.toFixed(4)}` : '';
  }

  /**
   * Muestra el tooltip de una sucursal específica y acelera el pulso
   */
  showTooltip(sucursalId: string): void {
    const tooltip = document.getElementById(`tooltip-${sucursalId}`);
    if (tooltip) {
      tooltip.classList.add('show');
      tooltip.setAttribute('opacity', '1');
    }
    
    // Acelerar el pulso durante el hover
    this.speedUpPulse(sucursalId, '1s');
  }

  /**
   * Oculta el tooltip de una sucursal específica y restaura velocidad del pulso
   */
  hideTooltip(sucursalId: string): void {
    const tooltip = document.getElementById(`tooltip-${sucursalId}`);
    if (tooltip) {
      tooltip.classList.remove('show');
      tooltip.setAttribute('opacity', '0');
    }
    
    // Restaurar velocidad normal del pulso
    this.speedUpPulse(sucursalId, '2s');
  }

  /**
   * Cambia la velocidad del pulso de una sucursal específica
   */
  private speedUpPulse(sucursalId: string, duration: string): void {
    const pulseR = document.getElementById(`pulse-r-${sucursalId}`) as any;
    const pulseO = document.getElementById(`pulse-o-${sucursalId}`) as any;
    
    if (pulseR && pulseO) {
      // Cambiar duración de las animaciones
      pulseR.setAttribute('dur', duration);
      pulseO.setAttribute('dur', duration);
      
      // Reiniciar las animaciones para que el cambio sea inmediato
      pulseR.beginElement();
      pulseO.beginElement();
    }
  }

  /**
   * Obtiene las sucursales a mostrar según el estado actual
   */
  getDisplayedSucursales(): Sucursal[] {
    if (this.showAllCards) {
      return this.sucursales;
    }
    return this.sucursales.slice(0, this.MOBILE_CARDS_LIMIT);
  }

  /**
   * Verifica si hay más cards para mostrar
   */
  hasMoreCards(): boolean {
    return this.sucursales.length > this.MOBILE_CARDS_LIMIT;
  }

  /**
   * Alterna entre mostrar todas las cards o solo las limitadas
   */
  toggleShowAllCards(): void {
    this.showAllCards = !this.showAllCards;
  }

  /**
   * Verifica si una card debe tener el degradado (es la última visible en móvil)
   */
  shouldShowGradient(index: number): boolean {
    return !this.showAllCards && 
           index === this.MOBILE_CARDS_LIMIT - 1 && 
           this.hasMoreCards();
  }

}
