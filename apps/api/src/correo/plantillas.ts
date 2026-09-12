/**
 * Plantillas de los correos transaccionales.
 *
 * Se arman con tablas y estilos en línea a propósito: es lo único que
 * interpretan bien todos los clientes de correo. Cada mensaje lleva además su
 * versión en texto plano.
 */

export type DatosPlantilla = Record<string, string | number | null | undefined>;

const COLOR = {
  aqua: '#00B0C7',
  teal: '#00A99D',
  verde: '#00B24A',
  azul: '#0089B8',
  tinta: '#16303F',
  gris: '#4E6473',
  nube: '#EDF3FB',
} as const;

const escapar = (v: unknown): string =>
  String(v ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

function envoltura(contenido: string, preencabezado: string): string {
  return `<!doctype html>
<html lang="es">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:${COLOR.nube};">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;">${escapar(preencabezado)}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${COLOR.nube};padding:32px 12px;">
  <tr><td align="center">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border-radius:20px;overflow:hidden;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
      <tr><td style="height:8px;background:linear-gradient(100deg,${COLOR.aqua},${COLOR.teal} 46%,${COLOR.verde});"></td></tr>
      <tr><td style="padding:32px 34px 8px;">
        <div style="font-size:13px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:${COLOR.teal};">CIRSUB</div>
        <div style="font-size:13px;color:${COLOR.gris};padding-top:2px;">Mutual del Círculo de Suboficiales de Gendarmería Nacional</div>
      </td></tr>
      <tr><td style="padding:12px 34px 30px;color:${COLOR.tinta};font-size:16px;line-height:1.6;">
        ${contenido}
      </td></tr>
      <tr><td style="padding:20px 34px 30px;border-top:1px solid #E7EEF3;color:#6C8091;font-size:13px;line-height:1.6;">
        Este mensaje se envió automáticamente. Si no esperabas recibirlo, ignoralo.
      </td></tr>
    </table>
  </td></tr>
</table>
</body></html>`;
}

const boton = (texto: string, enlace: string): string =>
  `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:26px 0;"><tr>
     <td style="border-radius:999px;background:${COLOR.azul};">
       <a href="${escapar(enlace)}" style="display:inline-block;padding:15px 30px;font-size:16px;font-weight:700;color:#ffffff;text-decoration:none;border-radius:999px;">${escapar(texto)}</a>
     </td></tr></table>`;

const enlaceCrudo = (enlace: string): string =>
  `<p style="font-size:13px;color:#6C8091;word-break:break-all;margin:18px 0 0;">Si el botón no funciona, copiá y pegá esta dirección:<br>${escapar(enlace)}</p>`;

interface Plantilla {
  html: (d: DatosPlantilla) => string;
  texto: (d: DatosPlantilla) => string;
}

const PLANTILLAS: Record<string, Plantilla> = {
  invitacion: {
    html: (d) =>
      envoltura(
        `<h1 style="font-size:26px;line-height:1.25;margin:0 0 14px;">Hola ${escapar(d['nombre'])}</h1>
         <p style="margin:0 0 12px;">Te dieron acceso al panel de administración del sitio de la Mutual con el rol de <strong>${escapar(d['rol'])}</strong>.</p>
         <p style="margin:0;">Para entrar, primero definí tu contraseña.</p>
         ${boton('Crear mi contraseña', String(d['enlace']))}
         <p style="margin:0;color:${COLOR.gris};font-size:14px;">El enlace vence en ${escapar(d['horas'])} horas y se puede usar una sola vez.</p>
         ${enlaceCrudo(String(d['enlace']))}`,
        'Creá tu contraseña para entrar al panel',
      ),
    texto: (d) =>
      `Hola ${d['nombre']}\n\nTe dieron acceso al panel de administración del sitio de la Mutual con el rol de ${d['rol']}.\n\nCreá tu contraseña acá:\n${d['enlace']}\n\nEl enlace vence en ${d['horas']} horas y se puede usar una sola vez.`,
  },

  reset: {
    html: (d) =>
      envoltura(
        `<h1 style="font-size:26px;line-height:1.25;margin:0 0 14px;">Hola ${escapar(d['nombre'])}</h1>
         <p style="margin:0 0 12px;">Pediste restablecer la contraseña de tu cuenta del panel.</p>
         ${boton('Elegir una contraseña nueva', String(d['enlace']))}
         <p style="margin:0;color:${COLOR.gris};font-size:14px;">El enlace vence en ${escapar(d['minutos'])} minutos. Si no fuiste vos, no hace falta que hagas nada: tu contraseña actual sigue siendo válida.</p>
         ${enlaceCrudo(String(d['enlace']))}`,
        'Restablecé tu contraseña',
      ),
    texto: (d) =>
      `Hola ${d['nombre']}\n\nPediste restablecer tu contraseña.\n\nEntrá acá:\n${d['enlace']}\n\nVence en ${d['minutos']} minutos. Si no fuiste vos, ignorá este mensaje.`,
  },

  'novedad-para-revisar': {
    html: (d) =>
      envoltura(
        `<h1 style="font-size:26px;line-height:1.25;margin:0 0 14px;">Hay una novedad esperando revisión</h1>
         <p style="margin:0 0 6px;">Hola ${escapar(d['nombre'])}.</p>
         <p style="margin:0 0 12px;"><strong>${escapar(d['autor'])}</strong>, de ${escapar(d['filial'])}, envió para revisar:</p>
         <p style="margin:0;padding:16px 18px;background:${COLOR.nube};border-radius:14px;font-size:18px;font-weight:700;">${escapar(d['titulo'])}</p>
         ${boton('Revisar la novedad', String(d['enlace']))}`,
        'Una novedad espera tu revisión',
      ),
    texto: (d) =>
      `Hola ${d['nombre']}\n\n${d['autor']}, de ${d['filial']}, envió para revisar la novedad "${d['titulo']}".\n\nRevisala acá:\n${d['enlace']}`,
  },

  'novedad-aprobada': {
    html: (d) =>
      envoltura(
        `<h1 style="font-size:26px;line-height:1.25;margin:0 0 14px;">Tu novedad ya está publicada</h1>
         <p style="margin:0 0 12px;">Hola ${escapar(d['nombre'])}. Aprobamos y publicamos:</p>
         <p style="margin:0;padding:16px 18px;background:#EAF7F1;border-radius:14px;font-size:18px;font-weight:700;">${escapar(d['titulo'])}</p>
         ${boton('Verla en el sitio', String(d['enlace']))}`,
        'Publicamos tu novedad',
      ),
    texto: (d) =>
      `Hola ${d['nombre']}\n\nTu novedad "${d['titulo']}" fue aprobada y ya está publicada.\n\nVerla:\n${d['enlace']}`,
  },

  'novedad-rechazada': {
    html: (d) =>
      envoltura(
        `<h1 style="font-size:26px;line-height:1.25;margin:0 0 14px;">Tu novedad necesita cambios</h1>
         <p style="margin:0 0 12px;">Hola ${escapar(d['nombre'])}. Revisamos <strong>${escapar(d['titulo'])}</strong> y antes de publicarla hace falta corregir esto:</p>
         <p style="margin:0;padding:16px 18px;background:#FFF7E8;border-left:4px solid #D99A16;border-radius:0 14px 14px 0;">${escapar(d['motivo'])}</p>
         ${boton('Corregir y volver a enviar', String(d['enlace']))}
         <p style="margin:0;color:${COLOR.gris};font-size:14px;">Podés corregirla y enviarla de nuevo, o cancelarla si preferís no publicarla.</p>`,
        'Tu novedad necesita cambios',
      ),
    texto: (d) =>
      `Hola ${d['nombre']}\n\nRevisamos "${d['titulo']}" y antes de publicarla hace falta corregir:\n\n${d['motivo']}\n\nCorregila acá:\n${d['enlace']}`,
  },
};

export function plantilla(nombre: string, datos: DatosPlantilla): { html: string; texto: string } {
  const p = PLANTILLAS[nombre];
  if (!p) throw new Error(`No existe la plantilla de correo "${nombre}"`);
  return { html: p.html(datos), texto: p.texto(datos) };
}
