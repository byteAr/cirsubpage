import { FUNCION_USUARIO, ROLES } from '@cirsub/shared';

export interface Responsabilidad {
  /** Cómo se lo nombra: «Administrador de datos de la Filial Posadas». */
  readonly titulo: string;
  /** Qué va a tener a cargo, en frases que se entienden sin conocer el panel. */
  readonly tareas: readonly string[];
}

/**
 * Lo que una persona va a tener a cargo, para contárselo en el correo.
 *
 * Quien recibe una invitación tiene que saber de qué se hace responsable antes
 * de crear la contraseña: «te dieron el rol de Usuario» no le dice nada.
 */
export function responsabilidadDe(
  rolSlug: string,
  funciones: readonly string[],
  filial: string | null,
): Responsabilidad {
  if (rolSlug === ROLES.COORDINADOR) {
    return {
      titulo: 'Coordinador del sitio de la Mutual',
      tareas: [
        'Designar y reemplazar a los administradores y a los responsables de cada sección.',
        'Aprobar o rechazar lo que cargan las filiales y los responsables antes de que se publique.',
        'Supervisar el panel completo: novedades, filiales, simulador de préstamos, usuarios y auditoría.',
      ],
    };
  }

  if (rolSlug === ROLES.ADMIN) {
    return {
      titulo: 'Administrador del panel de la Mutual',
      tareas: [
        'Dar de alta a los responsables de cada filial y de cada sección, y reemplazarlos cuando haga falta.',
        'Revisar y aprobar lo que cargan antes de que se publique en la página.',
        'Mantener las direcciones de las filiales y el resto del contenido institucional.',
      ],
    };
  }

  const tareas: string[] = [];
  const titulos: string[] = [];

  if (funciones.includes(FUNCION_USUARIO.FILIAL)) {
    const nombre = filial ?? 'tu filial';
    titulos.push(`Administrador de datos de la ${nombre}`);
    tareas.push(
      `Mantener actualizados los contactos de la ${nombre} en la página web del Círculo: WhatsApp, teléfono fijo y correo.`,
      'Cargar la capacidad del hotel, si la filial tiene, y los servicios de las habitaciones.',
      'Publicar los convenios y beneficios que la filial consiga para sus asociados.',
    );
  }
  if (funciones.includes(FUNCION_USUARIO.SIMULADOR)) {
    titulos.push('Responsable del simulador de préstamos');
    tareas.push(
      'Mantener al día los planes y coeficientes del simulador de préstamos personales de la página.',
    );
  }
  if (funciones.includes(FUNCION_USUARIO.NOVEDADES)) {
    titulos.push('Redactor de novedades');
    tareas.push('Redactar las novedades y proponer las que salen en el carrusel de la portada.');
  }

  if (titulos.length === 0) {
    return {
      titulo: 'Usuario del panel de la Mutual',
      tareas: ['Por ahora no tenés tareas asignadas: un administrador te las va a habilitar.'],
    };
  }

  tareas.push('Todo lo que cargues lo revisa un administrador antes de que aparezca en la página.');
  return { titulo: titulos.join(' y '), tareas };
}
