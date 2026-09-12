# Progreso

Estado al 12 de septiembre de 2026. Rama `feat/monorepo-backend`.

Este archivo existe para retomar sin releer todo: si la sesión se corta, acá está qué quedó hecho, qué falta y las decisiones que ya no hay que volver a discutir.

## Hecho

**Fase 1 · Andamio.** Monorepo con workspaces de npm. La aplicación Angular se movió a `apps/web` con `git mv`, así que conserva el historial. NestJS nuevo en `apps/api`. Contrato compartido en `packages/shared`, que compila a CommonJS y a ESM para que las dos aplicaciones lo consuman sin avisos.

**Fase 2 · Identidad.** Completa. Invitaciones con token hasheado y vencimiento de 72 horas, activación de cuenta, ingreso, refresco rotado con detección de reutilización, recuperación de contraseña, verificación en dos pasos preparada, límite de intentos con bloqueo temporal, auditoría de todo y los cinco correos transaccionales.

**Fase 3 · Medios.** Subida con `sharp`, seis variantes por imagen en WebP y AVIF, biblioteca con buscador, cuota por filial, y la interfaz de almacenamiento que permite mudar al NAS sin tocar la base.

**Fase 4 · Novedades y circuito editorial.** Entidad completa, editor TipTap, saneado en el servidor, resumen del carrusel con sus tres contadores y la vista previa en vivo, estados, revisiones con motivo obligatorio, historial y avisos por correo y por campana.

**Fase 5 · Migración de contenido.** La semilla carga las 20 filiales, 14 autoridades, 15 contactos, 5 categorías y las 12 páginas informativas, todo extraído de los archivos que estaban hardcodeados. Los servicios viejos de Angular se borraron.

**Fase 6 · Rediseño público.** Tokens del sistema de diseño en `styles.css` con Tailwind 4. Cabecera, pie, portada, novedades, detalle de novedad, nosotros, institucional, autoridades, servicios, trámites, plantilla informativa, filiales, contacto, recibos y error 404.

**Fase 7 · Movimiento.** Carrusel nuevo, showcase de la credencial guiado por scroll con rotación en tres ejes, revelado por scroll, y conservados el pulso de los pines del mapa y la transición entre rutas.

**Fase 8 · Producción.** Dockerfiles de API y sitio en varias etapas, `compose.prod.yaml` sin exponer nada al exterior, y los dos archivos de nginx listos para copiar.

## Verificado

- `npm run build:shared` compila.
- `npx nest build` y `npx tsc --noEmit` en la API pasan sin errores.
- `npx ng build` compila el sitio completo, incluida la extracción de rutas del renderizado en servidor.

## Probado contra una base real

Docker está en WSL. Se levantó PostgreSQL en el puerto 5434, se aplicaron las
migraciones, corrió la semilla y se recorrió todo de punta a punta.

Circuito editorial completo, con cada barrera:

- El referente activa su cuenta desde la invitación y queda con alcance propio.
- No puede publicar directo: la API se lo niega.
- Envía a revisión y la novedad queda bloqueada para él.
- El rechazo sin motivo se rechaza; con motivo pasa a cambios pedidos.
- Corrige, reenvía, el editor aprueba y sale publicada en el sitio.
- El referente solo ve la novedad de su filial, no las de las demás.
- Le llegan las dos notificaciones, la del rechazo y la de la aprobación.

Barreras de escalada de privilegios:

- El administrador de usuarios solo puede asignar el rol de referente.
- No puede invitar a un superadministrador ni suspender al que existe.
- No puede entrar a novedades ni a medios.
- Sin token no se entra a nada.

Contenido y medios:

- El saneado quita el script y el atributo peligroso, y marca los enlaces
  externos con noopener.
- Los límites del carrusel se rechazan en la API y se cortan en el formulario.
- Las variantes salen en WebP y AVIF con el recorte 4:3 exacto.

Panel en el navegador: ingreso, tablero con métricas reales, listado,
editor con sus contadores y la vista previa en vivo actualizándose al
escribir, y el editor de texto enriquecido montado con sus 23 herramientas.

## Lo que falta probar

El envío real de correo. Está simulado y los mensajes se escriben en el log.
Para probarlo de verdad hace falta la casilla de Google Workspace con su
contraseña de aplicación.

## Decisiones tomadas

- PrimeNG y DaisyUI se sacaron. No se usaban y el tema de PrimeNG arrastraba modo oscuro, que era justo lo que el sitio viejo peleaba a mano.
- El panel vive dentro de la misma aplicación Angular, en `/admin`, renderizado solo en el navegador. El sitio público se arma en el servidor en cada pedido.
- Angular 20.3 cambió la firma de arranque en el servidor: `bootstrapApplication` ahora necesita el contexto. Está aplicado en `main.server.ts`. Sin eso el build falla con NG0401.
- `provideAnimations()` se cambió por `provideAnimationsAsync()`, que es la que convive con el renderizado en servidor.
- Límites del carrusel: volanta 24, título 42, bajada 140. Están en el formulario, en el DTO y como restricción de columna en PostgreSQL.

## Pendiente del lado del cliente

1. La captura de la pantalla «Administrar» no hace falta: es función de administrador y quedó fuera del showcase. Los cinco tramos usan credencial, farmacia, seguros, menú e instalación.
2. Fotos de las autoridades y de las filiales. La semilla carga los datos sin imagen y el diseño muestra las iniciales mientras tanto.
3. Los correos de las filiales que estaban en el código eran de ejemplo, del estilo `cordobacapital@empresa.com`. La semilla los deja vacíos a propósito: se cargan desde el panel.
4. Ampliar el disco del servidor antes de desplegar.
