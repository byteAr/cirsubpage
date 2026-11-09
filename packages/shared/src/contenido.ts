/** Tipos del contenido institucional, compartidos por la API y el sitio. */

export type TipoPagina = 'SERVICIO' | 'TRAMITE' | 'INSTITUCIONAL';

export type TipoBloque = 'PARRAFO' | 'TITULO' | 'LISTA' | 'DESTACADO';

export interface BloqueInfo {
  readonly id?: string;
  readonly tipo: TipoBloque;
  readonly contenido: string | null;
  readonly items: readonly string[] | null;
  readonly orden: number;
}

export interface PaginaInfo {
  readonly id: string;
  readonly slug: string;
  readonly tipo: TipoPagina;
  readonly titulo: string;
  readonly subtitulo: string | null;
  readonly icono: string | null;
  readonly imagenUrl: string | null;
  readonly ctaTexto: string | null;
  readonly ctaEnlace: string | null;
  readonly ctaExterno: boolean;
  readonly orden: number;
  readonly bloques: readonly BloqueInfo[];
}

export interface Filial {
  readonly id: string;
  readonly nombre: string;
  readonly direccion: string | null;
  readonly contactos: readonly ContactoFilial[];
  /** Habitaciones disponibles para asociados. Null si la filial no tiene hotel. */
  readonly habitaciones: number | null;
  readonly convenios: readonly ConvenioFilial[];
  readonly lat: number;
  readonly lng: number;
  readonly svgX: number | null;
  readonly svgY: number | null;
  readonly fotoUrl: string | null;
  readonly orden: number;
}

export interface Autoridad {
  readonly id: string;
  readonly nombre: string;
  readonly rango: string;
  readonly cargo: string;
  readonly grupo: string;
  readonly orden: number;
  readonly fotoUrl: string | null;
  readonly reportaA: string | null;
}

export interface Contacto {
  readonly id: string;
  readonly nombre: string;
  readonly email: string;
  readonly telefono: string | null;
  readonly interno: string | null;
  readonly icono: string;
  readonly orden: number;
}

export interface ImagenVariantes {
  readonly original: string;
  readonly avif?: string;
  readonly webp?: string;
  readonly srcset?: string;
  readonly ancho?: number;
  readonly alto?: number;
  readonly alt?: string;
}

export interface SlideCarrusel {
  readonly id: string;
  readonly slug: string;
  readonly volanta: string;
  readonly titulo: string;
  readonly bajada: string;
  readonly imagen: ImagenVariantes | null;
}

export interface NovedadResumen {
  readonly id: string;
  readonly slug: string;
  readonly titulo: string;
  readonly bajada: string | null;
  readonly categoria: { readonly slug: string; readonly nombre: string } | null;
  readonly portada: ImagenVariantes | null;
  readonly publicadaEn: string | null;
  readonly filial: { readonly id: string; readonly nombre: string } | null;
  readonly minutosLectura: number;
}

export interface NovedadDetalle extends NovedadResumen {
  readonly cuerpoHtml: string;
  readonly autor: string | null;
  readonly relacionadas: readonly NovedadResumen[];
}

export interface Paginado<T> {
  readonly items: readonly T[];
  readonly total: number;
  readonly pagina: number;
  readonly porPagina: number;
  readonly totalPaginas: number;
}

// ───────────────────────── Ficha de filial

export const TIPO_CONTACTO = {
  WHATSAPP: 'whatsapp',
  TELEFONO: 'telefono',
  EMAIL: 'email',
} as const;

export type TipoContacto = (typeof TIPO_CONTACTO)[keyof typeof TIPO_CONTACTO];

export const TIPOS_CONTACTO: readonly {
  readonly id: TipoContacto;
  readonly nombre: string;
  readonly ejemplo: string;
}[] = [
  { id: TIPO_CONTACTO.WHATSAPP, nombre: 'WhatsApp', ejemplo: '+54 9 11 5000-0000' },
  { id: TIPO_CONTACTO.TELEFONO, nombre: 'Teléfono fijo', ejemplo: '+54 11 4300-0000' },
  { id: TIPO_CONTACTO.EMAIL, nombre: 'Correo', ejemplo: 'filial@cirsubgn.org' },
];

export interface ContactoFilial {
  readonly tipo: TipoContacto;
  readonly valor: string;
  /** Aclaración opcional, por ejemplo «Hotel» o «Administración». */
  readonly etiqueta?: string | null;
}

export interface ConvenioFilial {
  /** Con quién es el convenio: «Farmacia Pepito». */
  readonly nombre: string;
  /** Qué obtiene el asociado: «10 % de descuento». */
  readonly beneficio: string;
  readonly detalle?: string | null;
  /** Fecha ISO. Vencido, deja de mostrarse en la página. */
  readonly vigenteHasta?: string | null;
}

/** Los datos editables de una filial. */
export interface FichaFilial {
  /** Solo la cambia un administrador. */
  readonly direccion: string;
  readonly contactos: readonly ContactoFilial[];
  readonly habitaciones: number | null;
  readonly convenios: readonly ConvenioFilial[];
}

export const LIMITES_FICHA = { CONTACTOS: 20, CONVENIOS: 60 } as const;

const PATRON_TELEFONO = /^\+?[\d\s()-]{6,24}$/;
const PATRON_CORREO = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Devuelve el problema de un contacto, o null si está bien. */
export function problemaDeContacto(tipo: string, valor: string): string | null {
  const v = valor.trim();
  if (!v) return 'Falta completar el dato.';
  switch (tipo) {
    case TIPO_CONTACTO.TELEFONO:
    case TIPO_CONTACTO.WHATSAPP:
      return PATRON_TELEFONO.test(v) ? null : 'El número no parece válido.';
    case TIPO_CONTACTO.EMAIL:
      return PATRON_CORREO.test(v) ? null : 'El correo no parece válido.';
    default:
      return 'Ese tipo de contacto no existe.';
  }
}

/** El enlace que abre cada contacto. */
export function enlaceDeContacto(contacto: ContactoFilial): string {
  const v = contacto.valor.trim();
  switch (contacto.tipo) {
    case TIPO_CONTACTO.TELEFONO:
      return `tel:${v.replace(/[^\d+]/g, '')}`;
    case TIPO_CONTACTO.WHATSAPP:
      return `https://wa.me/${v.replace(/\D/g, '')}`;
    default:
      return `mailto:${v}`;
  }
}

// ───────────────────────── Simulador de préstamos

export interface PlanPrestamo {
  readonly cuotas: number;
  /** Cuota mensual que corresponde a cada peso prestado en este plazo. */
  readonly coeficiente: number;
}

export interface SimuladorPrestamos {
  readonly planes: readonly PlanPrestamo[];
}

export const CLAVE_SIMULADOR = 'simulador.prestamos';

/** Coeficientes del Departamento de Gestión de Préstamos y Convenios, septiembre de 2026. */
export const SIMULADOR_INICIAL: SimuladorPrestamos = {
  planes: [
    { cuotas: 9, coeficiente: 0.194869 },
    { cuotas: 12, coeficiente: 0.168986 },
    { cuotas: 18, coeficiente: 0.118046 },
    { cuotas: 26, coeficiente: 0.095352 },
  ],
};

/**
 * Devuelve el problema de un plan, o null si está bien.
 *
 * Un coeficiente que devuelve menos de lo prestado es casi seguro un error de
 * tipeo, y publicarlo le promete a la gente un préstamo que no existe.
 */
export function problemaDePlan(plan: PlanPrestamo): string | null {
  if (!Number.isInteger(plan.cuotas) || plan.cuotas < 1 || plan.cuotas > 120) {
    return 'Las cuotas tienen que ser un número entero entre 1 y 120.';
  }
  if (!Number.isFinite(plan.coeficiente) || plan.coeficiente <= 0 || plan.coeficiente > 2) {
    return 'El coeficiente tiene que ser mayor que 0.';
  }
  if (plan.coeficiente * plan.cuotas < 1) {
    return `En ${plan.cuotas} cuotas ese coeficiente devuelve menos de lo prestado.`;
  }
  return null;
}

// ───────────────────────── Cambios pendientes

export const TIPO_CAMBIO = { FILIAL: 'FILIAL', SIMULADOR: 'SIMULADOR' } as const;
export type TipoCambio = (typeof TIPO_CAMBIO)[keyof typeof TIPO_CAMBIO];
export type EstadoCambio = 'PENDIENTE' | 'APROBADO' | 'RECHAZADO' | 'REEMPLAZADO';

// ───────────────────────── Pedidos de baja de datos

export const ALCANCE_BAJA = { CUENTA_APP: 'CUENTA_APP', DATOS: 'DATOS' } as const;
export type AlcanceBaja = (typeof ALCANCE_BAJA)[keyof typeof ALCANCE_BAJA];

export const ETIQUETA_ALCANCE_BAJA: Record<AlcanceBaja, string> = {
  CUENTA_APP: 'Eliminar mi cuenta de la app',
  DATOS: 'Eliminar mi cuenta y mis datos personales',
};

export type EstadoBaja = 'PENDIENTE' | 'EN_CURSO' | 'RESUELTA' | 'RECHAZADA';

export const ETIQUETA_ESTADO_BAJA: Record<EstadoBaja, string> = {
  PENDIENTE: 'Pendiente',
  EN_CURSO: 'En curso',
  RESUELTA: 'Resuelta',
  RECHAZADA: 'Rechazada',
};


/**
 * Lo que se busca en el mapa al tocar «Cómo llegar»: dirección y localidad.
 *
 * El nombre aporta la localidad, sin «Filial» ni «Capital», que confunden a la
 * búsqueda: «Filial Jesús Maria (Córdoba)» pasa a ser «Jesús Maria, Córdoba».
 */
export function consultaDeDireccion(filial: {
  readonly nombre: string;
  readonly direccion: string | null;
}): string {
  const localidad = filial.nombre
    .replace(/^(Filial|Sede Central)\s*/i, '')
    .replace(/\s+Capital\b/i, '')
    .replace(/\s*\(([^)]*)\)/, ', $1')
    .replace(/^,\s*/, '')
    .trim();
  return [filial.direccion, localidad, 'Argentina'].filter(Boolean).join(', ');
}
