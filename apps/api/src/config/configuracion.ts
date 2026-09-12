/**
 * Configuración de la API leída del entorno.
 *
 * Se valida al arrancar: si falta algo esencial el proceso no levanta, que es
 * preferible a descubrirlo cuando alguien intenta recuperar su contraseña.
 */

const requerido = (clave: string): string => {
  const valor = process.env[clave];
  if (!valor || valor.trim() === '') {
    throw new Error(`Falta la variable de entorno ${clave}`);
  }
  return valor;
};

const entero = (clave: string, porDefecto: number): number => {
  const valor = process.env[clave];
  if (!valor) return porDefecto;
  const n = Number.parseInt(valor, 10);
  return Number.isFinite(n) ? n : porDefecto;
};

const booleano = (clave: string, porDefecto: boolean): boolean => {
  const valor = process.env[clave];
  if (valor === undefined) return porDefecto;
  return valor === 'true' || valor === '1';
};

const lista = (clave: string, porDefecto: string[] = []): string[] => {
  const valor = process.env[clave];
  if (!valor) return porDefecto;
  return valor
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
};

export const configuracion = () => {
  const produccion = process.env.NODE_ENV === 'production';

  return {
    entorno: process.env.NODE_ENV ?? 'development',
    produccion,
    puerto: entero('PORT', 3400),

    app: {
      nombre: 'CIRSUB',
      urlSitio: process.env.URL_SITIO ?? 'http://localhost:4200',
      urlApi: process.env.URL_API ?? 'http://localhost:3400',
      urlMedios: process.env.URL_MEDIOS ?? 'http://localhost:3400/media',
      origenesPermitidos: lista('ORIGENES_PERMITIDOS', ['http://localhost:4200', 'http://localhost:4300']),
      /// Cuántos saltos de proxy inverso hay adelante. Sin esto la API ve todas
      /// las peticiones viniendo de 127.0.0.1 y el límite de intentos bloquea a todos juntos.
      proxiesConfiables: entero('PROXIES_CONFIABLES', 1),
    },

    jwt: {
      secreto: produccion ? requerido('JWT_SECRET') : (process.env.JWT_SECRET ?? 'dev-secret-cambiar'),
      expiraAccesoSegundos: entero('JWT_ACCESO_SEGUNDOS', 900),
      expiraRefrescoDias: entero('JWT_REFRESCO_DIAS', 7),
      cookieRefresco: process.env.COOKIE_REFRESCO ?? 'cirsub_rt',
      cookieDominio: process.env.COOKIE_DOMINIO ?? undefined,
    },

    seguridad: {
      invitacionHoras: entero('INVITACION_HORAS', 72),
      resetMinutos: entero('RESET_MINUTOS', 60),
      maxIntentosIngreso: entero('MAX_INTENTOS_INGRESO', 5),
      bloqueoMinutos: entero('BLOQUEO_MINUTOS', 15),
    },

    almacenamiento: {
      raiz: process.env.STORAGE_RAIZ ?? './storage',
      maxBytesArchivo: entero('MAX_BYTES_ARCHIVO', 15 * 1024 * 1024),
      cuotaFilialBytes: entero('CUOTA_FILIAL_BYTES', 2 * 1024 * 1024 * 1024),
      mimesPermitidos: lista('MIMES_PERMITIDOS', [
        'image/jpeg',
        'image/png',
        'image/webp',
        'image/avif',
        'image/gif',
        'application/pdf',
        'video/mp4',
      ]),
    },

    correo: {
      habilitado: booleano('CORREO_HABILITADO', produccion),
      host: process.env.SMTP_HOST ?? 'smtp.gmail.com',
      puerto: entero('SMTP_PUERTO', 587),
      seguro: booleano('SMTP_SEGURO', false),
      usuario: process.env.SMTP_USUARIO ?? '',
      password: process.env.SMTP_PASSWORD ?? '',
      remitente: process.env.SMTP_REMITENTE ?? 'CIRSUB <noreply@cirsubgn.org>',
      responderA: process.env.SMTP_RESPONDER_A ?? 'secretaria@cirsubgn.org',
    },
  };
};

export type Configuracion = ReturnType<typeof configuracion>;
