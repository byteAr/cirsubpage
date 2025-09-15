# Header Responsive - Documentación

## Descripción
Header responsive que mantiene el hermoso diseño SVG original y agrega funcionalidad de menú hamburguesa para dispositivos móviles.

## Características

### 🎨 **Diseño Visual Mantenido**
- Conserva el hermoso SVG con gradiente de colores (`#00c854` a `#00b8db`)
- Mantiene las proporciones y efectos visuales originales
- Logo responsive que se adapta al tamaño de pantalla

### 📱 **Funcionalidad Responsive**

**Desktop (≥ 768px):**
- Menú horizontal tradicional
- Logo y navegación en una línea
- Menú móvil completamente oculto

**Móvil (< 768px):**
- Botón hamburguesa animado (3 líneas → X)
- Menú lateral deslizante desde la derecha
- Backdrop con blur para enfocar en el menú
- Navegación con iconos y efectos hover

### 🎯 **Funciones Interactivas**

1. **Botón Hamburguesa Animado:**
   ```css
   /* Transformación suave de 3 líneas a X */
   .hamburger-line-1-open { transform: rotate(45deg) translate(6px, 6px); }
   .hamburger-line-2-open { opacity: 0; transform: scale(0); }
   .hamburger-line-3-open { transform: rotate(-45deg) translate(6px, -6px); }
   ```

2. **Menú Lateral:**
   - Desliza desde la derecha con animación suave
   - Fondo con gradiente consistente con el header
   - Items con iconos y efectos hover
   - Cierre automático al hacer click en enlaces

3. **Control de Scroll:**
   - Bloquea el scroll del body cuando el menú está abierto
   - Compatible con SSR (verificación `typeof document`)

## Estructura de Navegación

```typescript
// Enlaces actuales del menú
const navegacion = [
  { href: "/", icono: "🏠", texto: "Inicio" },
  { href: "/filiales", icono: "📍", texto: "Filiales" },
  { href: "/contacto", icono: "📞", texto: "Contacto" }
];
```

## Propiedades del Componente

```typescript
export class Header {
  isMenuOpen: boolean = false;    // Estado del menú móvil
  
  toggleMenu(): void;             // Alterna el menú
  closeMenu(): void;              // Cierra el menú
  private toggleBodyScroll(): void; // Controla scroll del body
}
```

## Media Queries y Breakpoints

- **Desktop**: `@media (min-width: 768px)` - Menú horizontal
- **Móvil**: `@media (max-width: 767px)` - Menú hamburguesa
- **Móvil pequeño**: `@media (max-width: 480px)` - Ajustes adicionales

## Accesibilidad

- **ARIA**: `aria-expanded` en el botón hamburguesa
- **Labels**: `aria-label` descriptivo
- **Reducción de movimiento**: `@media (prefers-reduced-motion: reduce)`
- **Contraste**: Colores optimizados para legibilidad
- **Navegación por teclado**: Soporte completo

## Personalización

### Cambiar Enlaces:
```html
<!-- En header.html, actualizar tanto desktop como móvil -->
<li><a href="/nueva-seccion">Nueva Sección</a></li>
```

### Modificar Colores:
```css
/* En header.css */
.mobile-menu-content {
  background: linear-gradient(135deg, #TU_COLOR_1 0%, #TU_COLOR_2 100%);
}
```

### Ajustar Animaciones:
```css
.hamburger-line {
  transition: all 0.3s ease; /* Cambiar duración */
}
```

## Estados del Menú

1. **Cerrado** (estado inicial):
   - `isMenuOpen = false`
   - Botón hamburguesa visible
   - Menú lateral oculto (transform: translateX(100%))

2. **Abierto**:
   - `isMenuOpen = true`
   - Botón hamburguesa → X
   - Menú lateral visible (transform: translateX(0))
   - Body scroll bloqueado

## Eventos y Interacciones

```typescript
// Eventos disponibles
toggleMenu()     // Al hacer click en hamburguesa
closeMenu()      // Al hacer click en backdrop o enlace
             // Al redimensionar ventana (auto-cierre en desktop)
```

## Compatibilidad

- ✅ **Angular 17+** (usando nuevo control flow @if)
- ✅ **SSR** (Server-Side Rendering compatible)
- ✅ **Mobile First** (diseño responsive)
- ✅ **Accesibilidad** (WCAG 2.1 AA)
- ✅ **Navegadores modernos** (CSS Grid, Flexbox, Transforms)

## Ejemplo de Uso

El header está listo para usar y se integra automáticamente:

```html
<!-- En cualquier layout -->
<app-header></app-header>
<main>
  <!-- Contenido de la página -->
</main>
```

¡El header mantiene toda su belleza visual original mientras añade funcionalidad moderna para móviles! 🚀
