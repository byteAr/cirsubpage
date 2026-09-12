import sanitizeHtml from 'sanitize-html';

/**
 * Saneado del cuerpo de la nota.
 *
 * Corre al escribir, en el servidor, con lista blanca. Nunca se confía en lo
 * que manda el navegador: el contenido lo cargan veinte referentes distintos y
 * el editor es solo una interfaz, no un control de seguridad.
 */
const OPCIONES: sanitizeHtml.IOptions = {
  allowedTags: [
    'p', 'br', 'hr',
    'h2', 'h3', 'h4',
    'strong', 'b', 'em', 'i', 'u', 's', 'mark', 'sub', 'sup',
    'ul', 'ol', 'li',
    'blockquote', 'pre', 'code',
    'a', 'img', 'figure', 'figcaption',
    'table', 'thead', 'tbody', 'tr', 'th', 'td',
    'span', 'div', 'iframe',
  ],
  allowedAttributes: {
    a: ['href', 'title', 'target', 'rel'],
    img: ['src', 'alt', 'title', 'width', 'height', 'loading', 'srcset', 'sizes'],
    iframe: ['src', 'width', 'height', 'allow', 'allowfullscreen', 'title', 'frameborder'],
    th: ['colspan', 'rowspan', 'style'],
    td: ['colspan', 'rowspan', 'style'],
    span: ['style'],
    mark: ['style'],
    p: ['style'],
    h2: ['style'],
    h3: ['style'],
    h4: ['style'],
    div: ['class'],
    figure: ['class'],
  },
  // Solo color de texto, fondo y alineación: lo que el editor ofrece de verdad.
  allowedStyles: {
    '*': {
      color: [/^#(0x)?[0-9a-f]+$/i, /^rgb\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})\s*\)$/],
      'background-color': [
        /^#(0x)?[0-9a-f]+$/i,
        /^rgb\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})\s*\)$/,
      ],
      'text-align': [/^left$|^right$|^center$|^justify$/],
    },
  },
  allowedSchemes: ['http', 'https', 'mailto', 'tel'],
  allowedSchemesByTag: { img: ['http', 'https', 'data'] },
  // Solo se embeben videos de plataformas conocidas.
  allowedIframeHostnames: ['www.youtube.com', 'youtube.com', 'www.youtube-nocookie.com', 'player.vimeo.com'],
  allowIframeRelativeUrls: false,
  transformTags: {
    // Todo enlace externo se abre aparte y sin filtrar referencias.
    a: (nombre, atributos) => {
      const href = atributos['href'] ?? '';
      const externo = /^https?:\/\//i.test(href);
      return {
        tagName: nombre,
        attribs: externo
          ? { ...atributos, target: '_blank', rel: 'noopener noreferrer' }
          : atributos,
      };
    },
    img: (nombre, atributos) => ({
      tagName: nombre,
      attribs: { ...atributos, loading: 'lazy' },
    }),
  },
};

export function sanearHtml(html: string): string {
  return sanitizeHtml(html, OPCIONES);
}

/** Texto plano del cuerpo, para calcular el tiempo de lectura y los resúmenes. */
export function aTextoPlano(html: string): string {
  return sanitizeHtml(html, { allowedTags: [], allowedAttributes: {} })
    .replace(/\s+/g, ' ')
    .trim();
}

/** Minutos de lectura, redondeados hacia arriba, a 200 palabras por minuto. */
export function minutosLectura(html: string): number {
  const palabras = aTextoPlano(html).split(' ').filter(Boolean).length;
  return Math.max(1, Math.ceil(palabras / 200));
}
