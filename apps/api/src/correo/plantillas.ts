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

/** Las tareas viajan como texto con un salto de línea entre cada una. */
const listaTareas = (valor: unknown): string =>
  `<ul style="margin:0;padding-left:20px;">${String(valor ?? '')
    .split('\n')
    .filter(Boolean)
    .map((t) => `<li style="margin:0 0 6px;">${escapar(t)}</li>`)
    .join('')}</ul>`;

const tareasTexto = (valor: unknown): string =>
  String(valor ?? '')
    .split('\n')
    .filter(Boolean)
    .map((t) => `- ${t}`)
    .join('\n');

interface Plantilla {
  html: (d: DatosPlantilla) => string;
  texto: (d: DatosPlantilla) => string;
}

const PLANTILLAS: Record<string, Plantilla> = {
  invitacion: {
    html: (d) =>
      envoltura(
        `<h1 style="font-size:26px;line-height:1.25;margin:0 0 14px;">Hola ${escapar(d['nombre'])}</h1>
         <p style="margin:0 0 6px;">Te designaron</p>
         <p style="margin:0 0 16px;font-size:20px;font-weight:700;color:${COLOR.azul};line-height:1.35;">${escapar(d['titulo'])}</p>
         <p style="margin:0 0 8px;">Vas a estar a cargo de:</p>
         ${listaTareas(d['tareas'])}
         <p style="margin:16px 0 0;">Para entrar al panel, primero definí tu contraseña.</p>
         ${boton('Crear mi contraseña', String(d['enlace']))}
         <p style="margin:0;color:${COLOR.gris};font-size:14px;">El enlace vence en ${escapar(d['horas'])} horas y se puede usar una sola vez.</p>
         ${enlaceCrudo(String(d['enlace']))}`,
        `Te designaron ${String(d['titulo'] ?? '')}`,
      ),
    texto: (d) =>
      `Hola ${d['nombre']}\n\nTe designaron ${d['titulo']}.\n\nVas a estar a cargo de:\n${tareasTexto(d['tareas'])}\n\nCreá tu contraseña acá (vence en ${d['horas']} horas):\n${d['enlace']}`,
  },

  /** Para quien ya tiene cuenta y recibe una responsabilidad nueva o la de otra persona. */
  designacion: {
    html: (d) =>
      envoltura(
        `<h1 style="font-size:26px;line-height:1.25;margin:0 0 14px;">Hola ${escapar(d['nombre'])}</h1>
         <p style="margin:0 0 6px;">Desde ahora sos</p>
         <p style="margin:0 0 16px;font-size:20px;font-weight:700;color:${COLOR.azul};line-height:1.35;">${escapar(d['titulo'])}</p>
         <p style="margin:0 0 8px;">Vas a estar a cargo de:</p>
         ${listaTareas(d['tareas'])}
         ${boton('Entrar al panel', String(d['enlace']))}`,
        `Ahora sos ${String(d['titulo'] ?? '')}`,
      ),
    texto: (d) =>
      `Hola ${d['nombre']}\n\nDesde ahora sos ${d['titulo']}.\n\nVas a estar a cargo de:\n${tareasTexto(d['tareas'])}\n\nEntrá al panel: ${d['enlace']}`,
  },

  /**
   * Invitación de coordinador. Es otro nivel de responsabilidad y tiene que
   * notarse al abrirla: fondo oscuro, dorado y una tipografía con serifa. Se usan
   * fuentes que ya tiene cualquier equipo, porque los clientes de correo no
   * descargan tipografías.
   */
  'invitacion-coordinador': {
    html: (d) => {
      const serifa = "Georgia,'Times New Roman',Times,serif";
      const sans = "'Helvetica Neue',Helvetica,Arial,sans-serif";
      const oro = '#C9A54C';
      const noche = '#0E1B26';
      const tareas = String(d['tareas'] ?? '')
        .split('\n')
        .filter(Boolean)
        .map(
          (t) =>
            `<tr><td style="width:22px;vertical-align:top;padding:7px 0;color:${oro};font-family:${serifa};font-size:18px;">&#9670;</td>
             <td style="padding:7px 0;color:#DCE4EA;font-family:${sans};font-size:15px;line-height:1.6;">${escapar(t)}</td></tr>`,
        )
        .join('');
      return `<!doctype html>
<html lang="es">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#E9E4D8;">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;">Una invitación personal para coordinar el sitio de la Mutual</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#E9E4D8;padding:40px 12px;">
  <tr><td align="center">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:580px;background:${noche};border-radius:4px;overflow:hidden;">
      <tr><td style="height:3px;background:${oro};"></td></tr>
      <tr><td style="padding:44px 46px 10px;text-align:center;">
        <div style="font-family:${sans};font-size:11px;letter-spacing:.32em;text-transform:uppercase;color:${oro};">Mutual del Círculo de Suboficiales</div>
        <div style="font-family:${sans};font-size:11px;letter-spacing:.32em;text-transform:uppercase;color:${oro};padding-top:4px;">de Gendarmería Nacional</div>
        <div style="width:48px;height:1px;background:${oro};margin:26px auto 0;"></div>
      </td></tr>
      <tr><td style="padding:26px 46px 6px;text-align:center;">
        <div style="font-family:${serifa};font-size:15px;font-style:italic;color:#B9C6D0;">Invitación personal para</div>
        <h1 style="font-family:${serifa};font-weight:400;font-size:34px;line-height:1.2;color:#FFFFFF;margin:10px 0 6px;">${escapar(d['nombre'])}</h1>
        <div style="font-family:${serifa};font-size:19px;color:${oro};">${escapar(d['titulo'])}</div>
      </td></tr>
      <tr><td style="padding:30px 46px 6px;">
        <p style="margin:0 0 14px;color:#DCE4EA;font-family:${sans};font-size:15px;line-height:1.7;">
          Se te confía la coordinación del sitio y del panel de la Mutual. Vas a tener a cargo:
        </p>
        <table role="presentation" cellpadding="0" cellspacing="0" width="100%">${tareas}</table>
      </td></tr>
      <tr><td align="center" style="padding:30px 46px 8px;">
        <table role="presentation" cellpadding="0" cellspacing="0"><tr>
          <td style="border:1px solid ${oro};border-radius:2px;">
            <a href="${escapar(d['enlace'])}" style="display:inline-block;padding:16px 38px;font-family:${sans};font-size:13px;font-weight:700;letter-spacing:.2em;text-transform:uppercase;color:${oro};text-decoration:none;">Aceptar y crear mi contraseña</a>
          </td></tr></table>
      </td></tr>
      <tr><td style="padding:18px 46px 40px;text-align:center;color:#8396A5;font-family:${sans};font-size:13px;line-height:1.6;">
        El enlace es personal, vence en ${escapar(d['horas'])} horas y se usa una sola vez.<br>
        <span style="word-break:break-all;color:#6E8191;">${escapar(d['enlace'])}</span>
      </td></tr>
      <tr><td style="padding:18px 46px 26px;border-top:1px solid #22384A;text-align:center;color:#6E8191;font-family:${sans};font-size:12px;">
        Si no esperabas esta invitación, ignorala: sin la contraseña no se activa nada.
      </td></tr>
    </table>
  </td></tr>
</table>
</body></html>`;
    },
    texto: (d) =>
      `Invitación personal para ${d['nombre']}\n${d['titulo']}\n\nSe te confía la coordinación del sitio y del panel de la Mutual. Vas a tener a cargo:\n${tareasTexto(d['tareas'])}\n\nAceptá y creá tu contraseña (vence en ${d['horas']} horas):\n${d['enlace']}`,
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
