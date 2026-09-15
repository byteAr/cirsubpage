/**
 * Tapa el hueco que deja una imagen que no carga.
 *
 * El archivo puede faltar aunque el registro siga en la base: alcanza con que
 * se haya borrado del almacenamiento. Sin esto el navegador dibuja su ícono de
 * imagen rota con el texto alternativo al lado, que es justo lo que no queremos
 * que vea un asociado. En su lugar la imagen se oculta y en su sitio queda un
 * relleno en los tonos de la marca.
 *
 * Va acá y no en una directiva por vista porque hay tres casos que una
 * directiva no alcanza:
 *
 *   - Las que fallan durante la hidratación. El servidor ya mandó el `<img>`,
 *     así que el error salta antes de que Angular llegue a enganchar nada y el
 *     evento no se repite.
 *   - Las del cuerpo de una novedad, que entran como HTML ya armado y por lo
 *     tanto sin directivas.
 *   - Las que aparecen después, al cambiar de diapositiva o de página.
 *
 * Devuelve la función que desarma todo.
 */
export function vigilarImagenesRotas(documento: Document): () => void {
  /*
    El relleno entra como hermano de la imagen, no como clase del contenedor:
    el padre puede ser un envoltorio de maquetación que se usa en toda la
    página, y pintarlo desbordaría mucho más que el hueco de la foto.
  */
  const marcar = (img: HTMLImageElement): void => {
    // Una imagen sin `src` no es un fallo: todavía no le asignaron ninguna.
    if (!img.getAttribute('src')) return;
    if (img.dataset['caida'] === 'si') return;

    img.dataset['caida'] = 'si';
    img.hidden = true;

    // Con `<picture>` el relleno va afuera: las fuentes avif y webp del mismo
    // medio se caen junto con el original.
    const ancla: HTMLElement = img.closest('picture') ?? img;

    const relleno = documento.createElement('span');
    relleno.className = 'imagen-caida';
    relleno.dataset['rellenoDe'] = 'imagen';

    const alt = img.getAttribute('alt');
    if (alt) relleno.setAttribute('aria-label', alt);
    else relleno.setAttribute('aria-hidden', 'true');

    ancla.insertAdjacentElement('afterend', relleno);
  };

  const limpiar = (img: HTMLImageElement): void => {
    if (img.dataset['caida'] !== 'si') return;

    delete img.dataset['caida'];
    img.hidden = false;

    const ancla: HTMLElement = img.closest('picture') ?? img;
    const relleno = ancla.nextElementSibling;
    if (relleno instanceof HTMLElement && relleno.dataset['rellenoDe'] === 'imagen') {
      relleno.remove();
    }
  };

  /** Ya terminó de intentarlo y se quedó sin dimensiones: no llegó a cargar. */
  const yaFallo = (img: HTMLImageElement): boolean => img.complete && img.naturalWidth === 0;

  const revisar = (img: HTMLImageElement): void => {
    if (yaFallo(img)) marcar(img);
  };

  // `error` y `load` de una imagen no burbujean: hay que escucharlos en captura.
  const alFallar = (evento: Event): void => {
    if (evento.target instanceof HTMLImageElement) marcar(evento.target);
  };

  const alCargar = (evento: Event): void => {
    if (evento.target instanceof HTMLImageElement) limpiar(evento.target);
  };

  documento.addEventListener('error', alFallar, true);
  documento.addEventListener('load', alCargar, true);

  documento.querySelectorAll('img').forEach(revisar);

  /*
    Solo se miran los nodos que entran, no el documento entero: repasar todas
    las imágenes en cada mutación sería caro en páginas largas. A las que
    todavía no cargaron las agarra el escucha de `error`.
  */
  const observador = new MutationObserver((mutaciones) => {
    for (const mutacion of mutaciones) {
      for (const nodo of mutacion.addedNodes) {
        if (nodo instanceof HTMLImageElement) revisar(nodo);
        else if (nodo instanceof HTMLElement) nodo.querySelectorAll('img').forEach(revisar);
      }
    }
  });
  observador.observe(documento.body, { childList: true, subtree: true });

  return () => {
    documento.removeEventListener('error', alFallar, true);
    documento.removeEventListener('load', alCargar, true);
    observador.disconnect();
  };
}
