# Componente Mapa de Argentina - Guía de Uso

## Descripción
El `n
` es un componente reutilizable que muestra un mapa de Argentina con marcadores interactivos para sucursales o ubicaciones. Incluye tooltips, efectos de pulso y es completamente personalizable.

## Instalación
```typescript
import { ArgentinaMapComponent, type Sucursal } from './shared/components/argentina-map';
```

## Uso Básico

### 1. En tu componente TypeScript:
```typescript
import { Component } from '@angular/core';
import { ArgentinaMapComponent, type Sucursal } from './shared/components/argentina-map';

@Component({
  selector: 'app-mi-componente',
  standalone: true,
  imports: [ArgentinaMapComponent],
  template: `
    <app-argentina-map
      [sucursales]="misSucursales"
      [showLegend]="true"
      [legendTitle]="'Mis Ubicaciones'"
      (sucursalClick)="onSucursalClick($event)"
      (mapClick)="onMapClick($event)">
    </app-argentina-map>
  `
})
export class MiComponente {
  misSucursales: Sucursal[] = [
    {
      id: '1',
      nombre: 'Oficina Central',
      lat: -34.6118,
      lng: -58.3960,
      direccion: 'Av. Corrientes 1234, CABA',
      telefono: '+54 11 1234-5678',
      email: 'central@empresa.com'
    },
    // ... más sucursales
  ];

  onSucursalClick(sucursal: Sucursal) {
    console.log('Sucursal clickeada:', sucursal);
    // Tu lógica aquí
  }

  onMapClick(coords: {x: number, y: number, lat: number, lng: number}) {
    console.log('Click en mapa:', coords);
    // Tu lógica aquí
  }
}
```

## Propiedades de Entrada (@Input)

| Propiedad | Tipo | Valor por Defecto | Descripción |
|-----------|------|-------------------|-------------|
| `sucursales` | `Sucursal[]` | `[]` | Array de sucursales a mostrar en el mapa |
| `logoUrl` | `string` | `'cirsub.png'` | URL del logo a usar como marcador |
| `showLegend` | `boolean` | `true` | Mostrar/ocultar la leyenda del mapa |
| `legendTitle` | `string` | `'Sucursales en Argentina'` | Título de la leyenda |
| `containerClass` | `string` | `''` | Clases CSS adicionales para el contenedor |
| `enableTooltips` | `boolean` | `true` | Habilitar/deshabilitar tooltips |
| `enablePulse` | `boolean` | `true` | Habilitar/deshabilitar efectos de pulso |

## Eventos de Salida (@Output)

| Evento | Tipo | Descripción |
|--------|------|-------------|
| `sucursalClick` | `Sucursal` | Se emite cuando se hace click en una sucursal |
| `mapClick` | `{x: number, y: number, lat: number, lng: number}` | Se emite cuando se hace click en el mapa |

## Interface Sucursal

```typescript
interface Sucursal {
  id: string;          // ID único de la sucursal
  nombre: string;      // Nombre de la sucursal
  lat: number;         // Latitud (coordenada geográfica)
  lng: number;         // Longitud (coordenada geográfica)
  direccion?: string;  // Dirección (opcional)
  telefono?: string;   // Teléfono (opcional)
  email?: string;      // Email (opcional)
}
```

## Efectos Visuales Personalizables

El componente incluye clases CSS para efectos visuales que puedes aplicar usando `containerClass`:

```typescript
// Efecto de brillo
<app-argentina-map [containerClass]="'map-glow'">

// Efecto de desenfoque con hover
<app-argentina-map [containerClass]="'map-blur'">

// Efecto sepia
<app-argentina-map [containerClass]="'map-sepia'">

// Efecto escala de grises
<app-argentina-map [containerClass]="'map-grayscale'">
```

## Coordenadas Pre-calibradas

El componente incluye coordenadas pre-calibradas para 20+ ciudades argentinas. Para agregar nuevas ubicaciones, puedes:

1. **Usar ciudades existentes**: El sistema encuentra automáticamente la posición correcta para coordenadas cercanas a las calibradas.

2. **Calibrar manualmente**: Usa las herramientas de debug para obtener coordenadas SVG exactas.

## Ejemplo Avanzado

```typescript
@Component({
  template: `
    <app-argentina-map
      [sucursales]="sucursales"
      [logoUrl]="'mi-logo.png'"
      [showLegend]="false"
      [enableTooltips]="true"
      [enablePulse]="true"
      [containerClass]="'map-glow'"
      (sucursalClick)="abrirDetalle($event)"
      (mapClick)="agregarNuevaSucursal($event)">
    </app-argentina-map>
  `
})
export class MapaAvanzado {
  sucursales: Sucursal[] = [...];

  abrirDetalle(sucursal: Sucursal) {
    // Abrir modal o navegar a página de detalle
    this.router.navigate(['/sucursales', sucursal.id]);
  }

  agregarNuevaSucursal(coords: any) {
    // Lógica para agregar nueva sucursal en la posición clickeada
    console.log('Nueva sucursal en:', coords);
  }
}
```

## Notas Importantes

1. **SSR Compatible**: El componente funciona correctamente con Server-Side Rendering.
2. **Responsive**: Se adapta automáticamente a diferentes tamaños de pantalla.
3. **Accesible**: Incluye eventos de teclado y aria-labels apropiados.
4. **Performance**: Usa coordenadas pre-calculadas para renderizado rápido.

## Agregar Nuevas Ubicaciones

Para ubicaciones no calibradas, el componente usa interpolación matemática. Para mayor precisión:

1. Descomenta las herramientas de calibración en `filiales.html`
2. Activa el modo calibración
3. Selecciona la ciudad y haz click en el mapa
4. Copia las coordenadas generadas al código

¡El componente está listo para usar en cualquier parte de tu aplicación Angular!
