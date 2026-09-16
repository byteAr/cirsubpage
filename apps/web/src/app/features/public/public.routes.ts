import { Routes } from '@angular/router';

/*
  Cada ruta lleva sus metadatos en `data.seo`.

  El título y la descripción son lo que una persona lee en el listado de Google
  antes de decidir si entra, así que dicen qué hay en la página y para quién, no
  el nombre de la sección a secas. El servicio de metadatos los aplica en cada
  navegación; las vistas cuyo contenido viene de la base los pisan después con
  los datos reales.

  Las que no llevan `seo` acá lo resuelven solas: la novedad con su título y su
  bajada, y la página informativa con los suyos.
*/
export const PUBLIC_ROUTES: Routes = [
  {
    path: '',
    data: {
      seo: {
        titulo: 'Mutual del Círculo de Suboficiales de Gendarmería Nacional',
        descripcion:
          'Subsidios, reintegros, turismo, alojamiento y asesoramiento para suboficiales y gendarmes en actividad y retiro, pensionados, personal civil y sus familias. Veinte filiales en todo el país.',
      },
    },
    loadComponent: () => import('./pages/home/home').then((m) => m.Home),
  },

  // Novedades
  {
    path: 'novedades',
    data: {
      seo: {
        titulo: 'Novedades',
        descripcion:
          'Comunicados, beneficios nuevos y actividades de la sede central y de las veinte filiales de la Mutual del Círculo de Suboficiales de Gendarmería Nacional.',
      },
    },
    loadComponent: () => import('./pages/novedades/novedades').then((m) => m.Novedades),
  },
  {
    path: 'novedades/:slug',
    loadComponent: () => import('./pages/novedades/novedad-detalle').then((m) => m.NovedadDetalle),
  },

  // Nosotros
  {
    path: 'nosotros',
    data: {
      seo: {
        titulo: 'Quiénes somos',
        descripcion:
          'Qué es la Mutual del Círculo de Suboficiales de Gendarmería Nacional, a quiénes agrupa y cómo está organizada.',
      },
    },
    loadComponent: () => import('./pages/nosotros/nosotros').then((m) => m.Nosotros),
  },
  {
    path: 'nosotros/institucional',
    data: {
      seo: {
        titulo: 'Institucional',
        descripcion:
          'Historia, misión y marco legal de la Mutual del Círculo de Suboficiales de Gendarmería Nacional Argentina.',
      },
    },
    loadComponent: () =>
      import('./pages/nosotros/institucional/institucional').then((m) => m.Institucional),
  },
  {
    path: 'nosotros/autoridades',
    data: {
      seo: {
        titulo: 'Autoridades',
        descripcion:
          'Integrantes del Consejo Directivo y de la Junta Fiscalizadora de la Mutual del Círculo de Suboficiales de Gendarmería Nacional.',
      },
    },
    loadComponent: () =>
      import('./pages/nosotros/autoridades/autoridades').then((m) => m.Autoridades),
  },

  // Servicios y trámites: el índice y la plantilla única de página informativa
  {
    path: 'beneficios',
    data: {
      seo: {
        titulo: 'Servicios y beneficios',
        descripcion:
          'Subsidios por nacimiento, casamiento, fallecimiento y sepelio, reintegros, turismo y descuentos para los asociados de la mutual y sus familias.',
      },
    },
    loadComponent: () => import('./pages/beneficios/beneficios').then((m) => m.Beneficios),
  },
  {
    path: 'servicios/:slug',
    loadComponent: () =>
      import('../../shared/components/info-page/info-page').then((m) => m.InfoPage),
  },
  {
    path: 'tramites',
    data: {
      seo: {
        titulo: 'Trámites',
        descripcion:
          'Cómo asociarse, cómo pedir un reintegro y qué documentación hace falta para cada gestión ante la mutual, paso a paso.',
      },
    },
    loadComponent: () => import('./pages/tramites/tramites').then((m) => m.Tramites),
  },
  {
    path: 'tramites/:slug',
    loadComponent: () =>
      import('../../shared/components/info-page/info-page').then((m) => m.InfoPage),
  },

  {
    path: 'filiales',
    data: {
      seo: {
        titulo: 'Filiales en todo el país',
        descripcion:
          'Direcciones, teléfonos y correos de las veinte filiales de la Mutual del Círculo de Suboficiales de Gendarmería Nacional, provincia por provincia.',
      },
    },
    loadComponent: () => import('./pages/filiales/filiales').then((m) => m.Filiales),
  },
  {
    path: 'contacto',
    data: {
      seo: {
        titulo: 'Contacto',
        descripcion:
          'Teléfonos, correos y domicilio de la sede central de la mutual, y el formulario para hacer una consulta.',
      },
    },
    loadComponent: () => import('./pages/contact/contact').then((m) => m.Contact),
  },
  {
    path: 'recibos',
    data: {
      seo: {
        titulo: 'Recibos de haberes',
        descripcion:
          'Cómo consultar y descargar los recibos de haberes, y a dónde escribir si falta alguno.',
      },
    },
    loadComponent: () => import('./pages/recibos/recibos').then((m) => m.Recibos),
  },
  {
    path: 'alojamiento',
    data: {
      slug: 'alojamiento',
      seo: {
        titulo: 'Alojamiento',
        descripcion:
          'Alojamiento para asociados y sus familias: dónde hay plazas, cómo se reservan y qué incluye la estadía.',
      },
    },
    loadComponent: () =>
      import('../../shared/components/info-page/info-page').then((m) => m.InfoPage),
  },
];
