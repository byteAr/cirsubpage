import { RESPONSE_INIT, inject } from '@angular/core';

/**
 * Deja preparado el ajuste del estado de la respuesta a 404.
 *
 * El enrutador dibuja una vista para cualquier dirección que no existe, pero el
 * estado de la respuesta no se entera: el servidor contesta 200 con la página de
 * «no encontramos esto». Para una persona da igual; para un buscador es una
 * página válida, y termina indexando direcciones inventadas y repartiendo entre
 * ellas la relevancia del sitio. Es lo que se llama un 404 blando.
 *
 * Se usa en dos tiempos porque `inject` sólo puede llamarse al construir el
 * componente, y el momento de saber que no existe suele llegar después, cuando
 * responde la API:
 *
 *   private readonly marcarNoEncontrado = prepararNoEncontrado();
 *   ...
 *   error: () => { this.marcarNoEncontrado(); }
 *
 * En el navegador el token no existe y la función devuelta no hace nada: no hay
 * respuesta HTTP que ajustar.
 */
export function prepararNoEncontrado(): () => void {
  const respuesta = inject(RESPONSE_INIT, { optional: true });

  return () => {
    if (respuesta) respuesta.status = 404;
  };
}
