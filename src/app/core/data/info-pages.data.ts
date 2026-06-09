import { InfoPageContent } from '../models';

/**
 * Contenido declarativo de todas las páginas informativas (servicios + trámites).
 */
export const INFO_PAGES: Record<string, InfoPageContent> = {
  // ====== SERVICIOS ======
  'asesoramiento-contable': {
    titulo: 'Asesoramiento Contable',
    icono: 'asesoramiento-contable',
    bloques: [
      {
        tipo: 'parrafo',
        contenido:
          'Los socios del Círculo de Suboficiales de Gendarmería Nacional cuentan con un servicio de asesoramiento contable orientado a la gestión financiera personal y familiar.',
      },
      { tipo: 'titulo', contenido: 'Contacto' },
      { tipo: 'parrafo', contenido: '<strong>Mail:</strong> contaduria@cirsubgn.org' },
    ],
  },

  'asesoramiento-juridico': {
    titulo: 'Asesoramiento Jurídico',
    icono: 'asesoramiento-juridico',
    bloques: [
      {
        tipo: 'parrafo',
        contenido:
          'Todos los socios del Círculo de Suboficiales de Gendarmería Nacional podrán contar con el servicio de <strong>consultoría jurídica las 24 hs. y de forma gratuita</strong>.',
      },
      {
        tipo: 'parrafo',
        contenido:
          'El servicio cubre consultas de carácter profesional y de salud: los socios podrán ser asesorados sobre cuestiones ligadas a su labor y ante eventualidades que le puedan surgir.',
      },
      {
        tipo: 'destacado',
        contenido: 'Esta mutual exime a sus asociados del pago de honorarios en casos de ART.',
      },
      { tipo: 'titulo', contenido: 'Contacto' },
      {
        tipo: 'lista',
        items: ['<strong>Mail:</strong> legales@cirsubgn.org', '<strong>Tel:</strong> 11-3380-2923'],
      },
    ],
  },

  'bodas-de-oro': {
    titulo: 'Beneficios Bodas de Oro',
    icono: 'bodas-de-oro',
    bloques: [
      {
        tipo: 'parrafo',
        contenido:
          'La Mutual reconoce a los socios que celebran 50 años de matrimonio con un beneficio especial en concepto de Bodas de Oro.',
      },
      { tipo: 'titulo', contenido: 'Requisitos' },
      {
        tipo: 'lista',
        items: [
          'Acreditación de 50 años de matrimonio.',
          'Ser socio activo de la mutual.',
          'Acta de matrimonio actualizada.',
          'DNI del titular y cónyuge.',
        ],
      },
      { tipo: 'parrafo', contenido: '<strong>Contacto:</strong> bienestar@cirsubgn.org' },
    ],
  },

  'subsidio-casamiento': {
    titulo: 'Subsidio por Casamiento',
    icono: 'subsidio-casamiento',
    bloques: [
      {
        tipo: 'parrafo',
        contenido:
          'El socio titular percibirá un subsidio en concepto de casamiento conforme a los montos establecidos por la mutual.',
      },
      { tipo: 'titulo', contenido: 'Documentación a presentar' },
      {
        tipo: 'lista',
        items: ['Acta de matrimonio.', 'DNI del titular.', 'Último recibo de sueldo.'],
      },
      { tipo: 'parrafo', contenido: '<strong>Contacto:</strong> bienestar@cirsubgn.org' },
    ],
  },

  'subsidio-hijos': {
    titulo: 'Subsidio por Hijo',
    icono: 'subsidio-hijos',
    bloques: [
      {
        tipo: 'parrafo',
        contenido:
          'La Mutual otorga un subsidio por nacimiento, adopción o reconocimiento de hijos a sus socios titulares.',
      },
      { tipo: 'titulo', contenido: 'Documentación a presentar' },
      {
        tipo: 'lista',
        items: [
          'Partida de nacimiento o acta de adopción.',
          'DNI del titular y del menor.',
          'Constancia de CUIL del menor.',
        ],
      },
      { tipo: 'parrafo', contenido: '<strong>Contacto:</strong> bienestar@cirsubgn.org' },
    ],
  },

  'subsidio-sepelio': {
    titulo: 'Subsidio por Sepelio',
    icono: 'subsidio-sepelio',
    bloques: [
      {
        tipo: 'destacado',
        contenido:
          'Ante un fallecimiento, comuníquese las 24 horas al teléfono <strong>0800-888-7656</strong>.',
      },
      {
        tipo: 'parrafo',
        contenido:
          '<strong>Servicio de sepelio y subsidio por fallecimiento del socio titular o familiar.</strong>',
      },
      {
        tipo: 'parrafo',
        contenido:
          'La cobertura comprende al titular y grupo familiar integrado por la cónyuge (en caso de concubinato se aplica la resolución N.º 215/75 I.N.O.S.), las hijas solteras hasta los 21 años y los hijos solteros hasta los 18 sin hijos a cargo. Las hijas/hijos incapacitados sin límite de edad. Los padres del socio soltero sin hijos a cargo se consideran como grupo familiar.',
      },
      {
        tipo: 'parrafo',
        contenido:
          'En caso de no hacer uso del servicio, el socio titular y/o deudos podrán solicitar el reintegro por gastos según los montos preestablecidos por la mutual, presentando la documentación correspondiente.',
      },
      { tipo: 'titulo', contenido: 'Contacto' },
      {
        tipo: 'lista',
        items: ['<strong>Mail:</strong> bienestar@cirsubgn.org', '<strong>Tel:</strong> 113-270-5301'],
      },
    ],
  },

  turismo: {
    titulo: 'Turismo',
    icono: 'turismo',
    bloques: [
      {
        tipo: 'parrafo',
        contenido:
          'Contamos con 17 filiales que ofrecen hospedaje para nuestros asociados y para eventuales evacuados. ¡Una opción segura y accesible en momentos clave!',
      },
      { tipo: 'titulo', contenido: 'Reservas y consultas' },
      {
        tipo: 'lista',
        items: ['<strong>Tel:</strong> (011) 4334-0232', '<strong>Mail:</strong> turismo@cirsubgn.org'],
      },
    ],
  },

  farmacia: {
    titulo: 'Farmacia',
    icono: 'farmacia',
    bloques: [
      {
        tipo: 'parrafo',
        contenido:
          'Convenios para nuestros asociados adheridos a Farmacia. Presentando el DNI, podés acceder a un <strong>40% de descuento</strong> en la compra de medicamentos incluidos en el Vademécum IOSFA.',
      },
      {
        tipo: 'parrafo',
        contenido: 'Consultá en tu farmacia adherida para más detalles.',
      },
      { tipo: 'titulo', contenido: 'Contacto' },
      {
        tipo: 'lista',
        items: ['<strong>Mail:</strong> farmacia@cirsubgn.org', '<strong>Tel:</strong> 11-5855-8733'],
      },
    ],
  },

  evacuacion: {
    titulo: 'Evacuación',
    icono: 'evacuacion',
    bloques: [
      {
        tipo: 'parrafo',
        contenido:
          'Programa de ayuda al asociado que debe trasladarse por motivos de salud o trámites administrativos. La Mutual ofrece alojamiento y acompañamiento durante la estadía.',
      },
      { tipo: 'titulo', contenido: 'Contacto' },
      {
        tipo: 'lista',
        items: [
          '<strong>Mail:</strong> evacuaciones@cirsubgn.org',
          '<strong>Tel:</strong> (011) 4342-3068/69 int. 125',
        ],
      },
    ],
  },

  // ====== TRÁMITES ======
  afiliacion: {
    titulo: 'Afiliación',
    subtitulo: 'Asociate y disfrutá de todos los servicios y beneficios de la Mutual.',
    icono: 'afiliacion',
    bloques: [
      {
        tipo: 'parrafo',
        contenido:
          'Para asociarte a la Mutual del Círculo de Suboficiales de Gendarmería Nacional, debés acercarte a la sede central o a cualquiera de nuestras filiales con la siguiente documentación.',
      },
      { tipo: 'titulo', contenido: 'Documentación requerida' },
      {
        tipo: 'lista',
        items: [
          'DNI del titular.',
          'Último recibo de haberes.',
          'Constancia de CBU.',
          'Formulario de afiliación completo.',
        ],
      },
      { tipo: 'titulo', contenido: 'Contacto' },
      {
        tipo: 'parrafo',
        contenido: '<strong>Mail:</strong> afiliaciones@cirsubgn.org · <strong>Tel:</strong> 011 4342-3068/69',
      },
    ],
    cta: {
      texto: 'Contactar afiliaciones',
      enlace: 'mailto:afiliaciones@cirsubgn.org',
      externo: false,
    },
  },

  'actualizacion-datos': {
    titulo: 'Actualización de Datos',
    subtitulo: 'Mantené tus datos personales al día para no perder cobertura ni comunicaciones.',
    icono: 'actualizacion-datos',
    bloques: [
      {
        tipo: 'parrafo',
        contenido:
          'Si cambiaste de domicilio, teléfono, correo electrónico o estado civil, te pedimos que actualices tus datos enviando la documentación respaldatoria al departamento de Recursos Humanos.',
      },
      { tipo: 'titulo', contenido: 'Contacto' },
      {
        tipo: 'parrafo',
        contenido: '<strong>Mail:</strong> recursoshumanos@cirsubgn.org',
      },
    ],
    cta: {
      texto: 'Enviar actualización',
      enlace: 'mailto:recursoshumanos@cirsubgn.org',
    },
  },

  'alta-familiar': {
    titulo: 'Alta Familiar',
    subtitulo: 'Sumá familiares directos a tu cobertura.',
    icono: 'alta-familiar',
    bloques: [
      {
        tipo: 'parrafo',
        contenido:
          'El socio titular puede dar de alta a su cónyuge, hijos solteros y, en casos especiales, a sus padres como integrantes de su grupo familiar.',
      },
      { tipo: 'titulo', contenido: 'Documentación requerida' },
      {
        tipo: 'lista',
        items: [
          'DNI del familiar a incorporar.',
          'Acta de matrimonio o de nacimiento, según corresponda.',
          'Formulario de alta familiar.',
        ],
      },
      { tipo: 'parrafo', contenido: '<strong>Contacto:</strong> bienestar@cirsubgn.org' },
    ],
  },

  // ====== OTRAS ======
  recibos: {
    titulo: 'Consulta de Recibos',
    subtitulo: 'Accedé a tus recibos de haberes según tu situación.',
    bloques: [
      {
        tipo: 'parrafo',
        contenido:
          'Seleccioná el portal correspondiente según tu situación de revista (actividad o retiro).',
      },
    ],
  },

  alojamiento: {
    titulo: 'Alojamiento',
    subtitulo: 'Reservas en nuestras filiales y Hotel Tacuarí.',
    imagen: 'images/filiales/tacuarí.jpg',
    bloques: [
      {
        tipo: 'parrafo',
        contenido:
          'La Mutual cuenta con 17 filiales con hospedaje en todo el país y el Hotel Tacuarí en la sede central de CABA, todos al servicio de nuestros asociados.',
      },
      { tipo: 'titulo', contenido: 'Contacto Hotel Tacuarí' },
      {
        tipo: 'lista',
        items: [
          '<strong>Recepción:</strong> hoteltacuari@cirsubgn.org',
          '<strong>Tel:</strong> (011) 4334-0223 / 0232',
        ],
      },
    ],
  },
};
