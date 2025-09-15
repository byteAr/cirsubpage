# Componente de Mapa de Argentina

Este componente permite mostrar un mapa SVG de Argentina con pines interactivos que representan las ubicaciones de sucursales basadas en coordenadas de latitud y longitud.

## Características

- **Mapa SVG**: Representación vectorial de Argentina que es escalable y responsive
- **Conversión de coordenadas**: Convierte coordenadas geográficas (lat/lng) a coordenadas SVG
- **Pines interactivos**: Marcadores clickeables con información de sucursales
- **Tooltips**: Información adicional al hacer hover sobre los pines
- **Responsive**: Se adapta a diferentes tamaños de pantalla
- **Animaciones**: Efectos visuales suaves y atractivos

## Uso

### Importación

```typescript
import { ArgentinaMapComponent, type Sucursal } from '../../../shared/components/argentina-map';
```

### Interface Sucursal

```typescript
interface Sucursal {
  id: string;
  nombre: string;
  lat: number;        // Latitud (ej: -34.6037)
  lng: number;        // Longitud (ej: -58.3816)
  direccion?: string;
  telefono?: string;
  email?: string;
}
```

### Implementación en HTML

```html
<app-argentina-map 
  [sucursales]="sucursales"
  [width]="900"
  [height]="700">
</app-argentina-map>
```

### Ejemplo de datos

```typescript
sucursales: Sucursal[] = [
  {
    id: '1',
    nombre: 'Sucursal Buenos Aires Centro',
    lat: -34.6037,
    lng: -58.3816,
    direccion: 'Av. Corrientes 1234, CABA',
    telefono: '+54 11 4000-0001',
    email: 'buenosaires@empresa.com'
  },
  // ... más sucursales
];
```

## Propiedades

| Propiedad | Tipo | Default | Descripción |
|-----------|------|---------|-------------|
| `sucursales` | `Sucursal[]` | `[]` | Array de sucursales a mostrar |
| `width` | `number` | `800` | Ancho del mapa en píxeles |
| `height` | `number` | `600` | Alto del mapa en píxeles |

## Eventos

- **onSucursalClick**: Se ejecuta cuando se hace click en un pin de sucursal

## Coordenadas de Referencia

### Límites de Argentina
- Norte: -21.780
- Sur: -55.061
- Este: -53.628
- Oeste: -73.583

### Ciudades Principales
- Buenos Aires: `-34.6037, -58.3816`
- Córdoba: `-31.4201, -64.1888`
- Rosario: `-32.9442, -60.6505`
- Mendoza: `-32.8908, -68.8272`
- Mar del Plata: `-38.0055, -57.5426`
- Tucumán: `-26.8083, -65.2176`
- Salta: `-24.7821, -65.4232`
- Neuquén: `-38.9516, -68.0591`

## Personalización

### Estilos CSS Disponibles

- `.argentina-map-container`: Contenedor principal
- `.argentina-map-svg`: Elemento SVG del mapa
- `.country-path`: Contorno del país
- `.sucursal-pin`: Pines de sucursales
- `.pin-circle`: Círculo principal del pin
- `.pin-center`: Punto central del pin
- `.tooltip`: Información emergente
- `.legend`: Leyenda del mapa

### Modificar Colores

```css
.pin-circle {
  fill: #tu-color;  /* Color del pin */
}

.country-path {
  fill: #tu-color;  /* Color del país */
  stroke: #tu-color; /* Color del borde */
}
```

## Responsive Design

El componente incluye breakpoints para:
- Desktop: `> 768px`
- Tablet: `768px`
- Mobile: `< 480px`

## Compatibilidad

- Angular 17+
- Standalone Components
- SSR Compatible
- Navegadores modernos con soporte SVG

## Notas Técnicas

1. **Conversión de coordenadas**: El componente usa una proyección simple para convertir coordenadas geográficas a coordenadas SVG
2. **Performance**: Optimizado para mostrar hasta 50 sucursales simultáneamente
3. **Accesibilidad**: Incluye atributos ARIA y soporte para navegación por teclado

## Ejemplo Completo

Ver `src/app/features/public/pages/filiales/` para un ejemplo completo de implementación.
