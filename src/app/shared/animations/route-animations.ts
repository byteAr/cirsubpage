import { trigger, transition, style, query, animateChild, group, animate } from '@angular/animations';

export const routeAnimations = trigger('routeAnimations', [
  // Transición de deslizamiento hacia la derecha (para navegación hacia adelante)
  transition('* => *', [
    style({ position: 'relative' }),
    query(':enter, :leave', [
      style({
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        opacity: 0
      })
    ], { optional: true }),
    
    // Configurar estado inicial
    query(':enter', [
      style({ 
        opacity: 0,
        transform: 'translateX(100px)',
        filter: 'blur(2px)'
      })
    ], { optional: true }),
    
    query(':leave', [
      style({ 
        opacity: 1,
        transform: 'translateX(0)',
        filter: 'blur(0px)'
      })
    ], { optional: true }),
    
    // Ejecutar animaciones en grupo
    group([
      // Animar salida del componente anterior
      query(':leave', [
        animate('300ms ease-out', style({ 
          opacity: 0,
          transform: 'translateX(-50px)',
          filter: 'blur(2px)'
        }))
      ], { optional: true }),
      
      // Animar entrada del nuevo componente
      query(':enter', [
        animate('400ms 100ms ease-out', style({ 
          opacity: 1,
          transform: 'translateX(0)',
          filter: 'blur(0px)'
        }))
      ], { optional: true })
    ])
  ])
]);

// Animación alternativa más sutil (fade)
export const fadeAnimation = trigger('fadeAnimation', [
  transition('* => *', [
    query(':enter, :leave', [
      style({
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%'
      })
    ], { optional: true }),
    
    query(':enter', [
      style({ opacity: 0, transform: 'scale(0.95)' })
    ], { optional: true }),
    
    group([
      query(':leave', [
        animate('250ms ease-in', style({ 
          opacity: 0,
          transform: 'scale(1.05)'
        }))
      ], { optional: true }),
      
      query(':enter', [
        animate('350ms 150ms ease-out', style({ 
          opacity: 1,
          transform: 'scale(1)'
        }))
      ], { optional: true })
    ])
  ])
]);

// Animación de deslizamiento optimizada (compatible con modales)
export const slideAnimation = trigger('slideAnimation', [
  transition('* => *', [
    style({ position: 'relative' }),
    query(':enter, :leave', [
      style({
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        minHeight: '100vh'
      })
    ], { optional: true }),
    
    query(':enter', [
      style({ 
        opacity: 0,
        transform: 'translateX(30px) scale(0.99)',
        zIndex: 1
      })
    ], { optional: true }),
    
    query(':leave', [
      style({ 
        opacity: 1,
        transform: 'translateX(0) scale(1)',
        zIndex: 0
      })
    ], { optional: true }),
    
    group([
      query(':leave', [
        animate('200ms ease-in', style({ 
          opacity: 0,
          transform: 'translateX(-20px) scale(1.01)'
        }))
      ], { optional: true }),
      
      query(':enter', [
        animate('300ms 50ms cubic-bezier(0.25, 0.8, 0.25, 1)', style({ 
          opacity: 1,
          transform: 'translateX(0) scale(1)'
        }))
      ], { optional: true })
    ]),
    
    // Limpiar estilos al finalizar para evitar conflictos con modales
    query(':enter', [
      animate('0ms', style({
        position: 'static',
        transform: 'none',
        zIndex: 'auto'
      }))
    ], { optional: true })
  ])
]);
