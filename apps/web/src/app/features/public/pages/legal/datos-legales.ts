/**
 * Datos de la institución que aparecen en los textos legales.
 *
 * Lo que está entre corchetes falta confirmar: no se publica en producción hasta
 * que se complete y la asesoría legal revise los textos. Cuando eso pase, poner
 * BORRADOR en false quita el aviso de las tres páginas.
 */
export const DATOS_LEGALES = {
  BORRADOR: true,
  RAZON_SOCIAL: 'Mutual del Círculo de Suboficiales de Gendarmería Nacional',
  CUIT: '[CUIT a completar]',
  MATRICULA: '[matrícula INAES a completar]',
  DOMICILIO: 'Tacuarí 566, C1071 Ciudad Autónoma de Buenos Aires, Argentina',
  CORREO_PRIVACIDAD: 'legales@cirsubgn.org',
  CONSERVACION: '[plazo de conservación a definir con la asesoría legal]',
  VIGENTE_DESDE: '[fecha de vigencia a completar]',
} as const;
