# Sistema de Animaciones de Ruta

Este sistema proporciona transiciones suaves entre las diferentes rutas de la aplicación Angular.

## ¿Qué hace?

Las animaciones de ruta crean transiciones visuales fluidas cuando el usuario navega entre diferentes páginas de la aplicación, eliminando el cambio brusco que ocurre por defecto.

## Tipos de Animaciones Disponibles

### 1. `slideAnimation` (Actualmente en uso)
- **Efecto**: Deslizamiento horizontal con desenfoque
- **Duración**: 400ms para entrada, 300ms para salida
- **Características**:
  - El contenido nuevo entra desde la derecha con un ligero desenfoque
  - El contenido anterior sale hacia la izquierda con desenfoque
  - Incluye un retraso de 100ms para la entrada para evitar solapamientos

### 2. `fadeAnimation` (Alternativa disponible)
- **Efecto**: Desvanecimiento con escalado sutil
- **Duración**: 350ms para entrada, 250ms para salida
- **Características**:
  - Transición más sutil y elegante
  - Escalado ligero (0.95 a 1.0) para dar sensación de profundidad

### 3. `routeAnimations` (Versión completa)
- **Efecto**: Deslizamiento horizontal con desenfoque y efectos avanzados
- **Duración**: 400ms para entrada, 300ms para salida
- **Características**:
  - Más personalizable y con efectos visuales adicionales

## Cómo Funciona

### 1. Configuración de Animaciones (`route-animations.ts`)
```typescript
export const slideAnimation = trigger('slideAnimation', [
  transition('* => *', [
    // Configuración de estados iniciales y finales
    // Animaciones de entrada y salida en grupo
  ])
]);
```

### 2. Integración en el Componente Principal (`app.ts`)
```typescript
@Component({
  animations: [slideAnimation] // Registra la animación
})
export class App {
  getRouteAnimationData() {
    // Obtiene el estado de la ruta para activar animaciones
    return this.contexts.getContext('primary')?.route?.snapshot?.url || '';
  }
}
```

### 3. Aplicación en el Template (`app.html`)
```html
<main [@slideAnimation]="getRouteAnimationData()" class="route-container">
  <router-outlet></router-outlet>
</main>
```

### 4. Estilos de Soporte (`app.css` y `styles.css`)
- **Contenedor de rutas**: Posicionamiento relativo y control de overflow
- **Optimizaciones**: `backface-visibility`, `transform: translateZ(0)` para mejor rendimiento
- **Transiciones globales**: Suavizado de fuentes y scroll behavior

## Optimizaciones de Rendimiento

### Hardware Acceleration
```css
.route-container * {
  backface-visibility: hidden;
  transform: translateZ(0);
}
```
- Activa la aceleración por hardware de la GPU
- Mejora la fluidez de las animaciones

### Will-Change Property
```css
.route-container {
  will-change: transform, opacity;
}
```
- Informa al navegador qué propiedades van a cambiar
- Permite optimizaciones previas del motor de renderizado

### Timing Functions
- `ease-out`: Para entradas naturales
- `ease-in`: Para salidas rápidas
- `cubic-bezier(0.25, 0.8, 0.25, 1)`: Para movimientos más orgánicos

## Personalización

### Cambiar Tipo de Animación
En `app.ts`, cambia la importación:
```typescript
import { fadeAnimation } from './shared/animations/route-animations';

@Component({
  animations: [fadeAnimation] // Cambia aquí
})
```

Y en `app.html`:
```html
<main [@fadeAnimation]="getRouteAnimationData()">
```

### Ajustar Duración
En `route-animations.ts`, modifica los valores de `animate()`:
```typescript
animate('200ms ease-out', style({ ... })) // Más rápido
animate('600ms ease-out', style({ ... })) // Más lento
```

### Crear Animación Personalizada
```typescript
export const customAnimation = trigger('customAnimation', [
  transition('* => *', [
    // Tu configuración personalizada aquí
  ])
]);
```

## Beneficios

1. **Experiencia de Usuario Mejorada**: Transiciones suaves y profesionales
2. **Feedback Visual**: El usuario entiende que está navegando
3. **Percepción de Velocidad**: Las animaciones hacen que la app se sienta más rápida
4. **Profesionalismo**: Apariencia más pulida y moderna
5. **Accesibilidad**: Respeta las preferencias de movimiento reducido del usuario

## Consideraciones

- **Rendimiento**: Las animaciones están optimizadas para 60fps
- **Accesibilidad**: Se pueden desactivar con `prefers-reduced-motion`
- **Compatibilidad**: Funciona en todos los navegadores modernos
- **Mantenimiento**: Fácil de modificar o desactivar si es necesario
