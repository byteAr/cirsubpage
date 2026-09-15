export const environment = {
  produccion: true,
  // Mismo origen: nginx manda /api al contenedor de la API. Sin CORS y con la
  // cookie de sesión atada al sitio en vez de a todo el dominio.
  urlApi: '/api',
  urlCredencial: 'https://credencial.cirsubgn.org.ar',
  urlGestion: 'https://admin.cirsubgn.org.ar',
};
