import sanitizeHtml from 'sanitize-html';

/**
 * Saneado del texto de los bloques de una página de servicio.
 *
 * Es más estricto que el de las novedades porque el editor del panel solo
 * ofrece negrita, cursiva, enlaces y salto de línea: cualquier otra etiqueta
 * vino por otro lado y rompería el diseño de la plantilla. Corre en el
 * servidor porque el sitio publica este HTML tal cual.
 */
const OPCIONES: sanitizeHtml.IOptions = {
  allowedTags: ['strong', 'b', 'em', 'i', 'a', 'br'],
  allowedAttributes: { a: ['href', 'target', 'rel'] },
  allowedSchemes: ['http', 'https', 'mailto', 'tel'],
  transformTags: {
    // Lo que el editor no distingue se unifica, para que el HTML guardado sea uno solo.
    b: 'strong',
    i: 'em',
    a: (nombre, atributos) => {
      const href = (atributos['href'] ?? '').trim();
      const externo = /^https?:\/\//i.test(href);
      // Los enlaces internos no llevan target: el sitio los navega sin recargar.
      const attribs: sanitizeHtml.Attributes = externo
        ? { href, target: '_blank', rel: 'noopener noreferrer' }
        : { href };
      return { tagName: nombre, attribs };
    },
  },
};

export function sanearBloque(html: string): string {
  return sanitizeHtml(html, OPCIONES).trim();
}

/**
 * Para los títulos de sección. El sitio los muestra como texto, escapados, así
 * que alcanza con sacar etiquetas. No se pasa por sanitize-html porque
 * convertiría «&» en «&amp;» y el título saldría con la entidad a la vista.
 */
export function textoPlano(texto: string): string {
  return texto.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
}
