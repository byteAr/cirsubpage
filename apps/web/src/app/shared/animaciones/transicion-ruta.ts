import { animate, group, query, style, transition, trigger } from '@angular/animations';

/**
 * Transición entre rutas.
 *
 * Se conserva del sitio anterior porque al cliente le gusta: la vista saliente
 * se va a la izquierda mientras la entrante llega desde la derecha con una
 * escala mínima. Curva y tiempos son los originales, apenas afinados.
 *
 * Al terminar se limpian los estilos para que ninguna vista quede posicionada
 * en absoluto, que es lo que rompía los modales en la versión anterior.
 */
export const transicionRuta = trigger('transicionRuta', [
  transition('* => *', [
    style({ position: 'relative' }),

    query(
      ':enter, :leave',
      [style({ position: 'absolute', top: 0, left: 0, width: '100%' })],
      { optional: true },
    ),

    query(
      ':enter',
      [style({ opacity: 0, transform: 'translateX(28px) scale(0.995)', zIndex: 1 })],
      { optional: true },
    ),

    query(
      ':leave',
      [style({ opacity: 1, transform: 'none', zIndex: 0 })],
      { optional: true },
    ),

    group([
      query(
        ':leave',
        [
          animate(
            '200ms ease-in',
            style({ opacity: 0, transform: 'translateX(-20px) scale(1.008)' }),
          ),
        ],
        { optional: true },
      ),
      query(
        ':enter',
        [
          animate(
            '300ms 50ms cubic-bezier(0.25, 0.8, 0.25, 1)',
            style({ opacity: 1, transform: 'none' }),
          ),
        ],
        { optional: true },
      ),
    ]),

    query(
      ':enter',
      [animate('0ms', style({ position: 'static', transform: 'none', zIndex: 'auto' }))],
      { optional: true },
    ),
  ]),
]);
