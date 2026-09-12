# Prompt para Claude Design — Rediseño integral CIRSUB

> Copiá y pegá todo el contenido de abajo (desde "ROL" hasta el final) en Claude Design.
> Adjuntá además: `public/cirsublogo.png`, 3–4 fotos de `public/filiales/`, las capturas de la app de Credencial Virtual y, si querés, un screenshot del sitio actual como referencia de "lo que hay que superar".

---

## ROL Y OBJETIVO

Sos el director de arte y diseñador de producto de un rediseño integral. Tenés que entregar el sistema de diseño completo y todas las pantallas (web pública + panel administrativo) de un sitio institucional argentino.

**Cliente:** Mutual del Círculo de Suboficiales de Gendarmería Nacional Argentina (CIRSUB). Es una mutual para suboficiales y gendarmes en actividad, retirados, pensionados, personal civil y familiares directos. Fundada hace más de 70 años, 20 filiales en todo el país, sede central en Tacuarí 566, CABA.

**Objetivo:** el sitio actual es funcional pero genérico (verde saturado plano, cards con sombra, layouts centrados, tipografía única). Hay que dar un giro de 180° en lo visual **conservando exactamente la misma arquitectura de información y el mismo contenido**. El resultado tiene que leerse como institucional, sobrio, contemporáneo y con oficio editorial. Elegante, no excéntrico. Con movimiento, no con ruido.

**Tono visual buscado:** rigor institucional + calidez de una entidad de ayuda mutua. Referencias de nivel: sitios de fundaciones europeas, bancos cooperativos escandinavos, revistas digitales de arquitectura. Nada de neón, glassmorphism gratuito, degradés arcoíris, ilustraciones 3D genéricas ni "AI look".

---

## RESTRICCIONES INNEGOCIABLES

Estas tres cosas existen hoy, funcionan y **se conservan**. Diseñá alrededor de ellas.

1. **Mapa de Argentina con pines animados.** Silueta del país en SVG, un pin por filial usando el logo circular de CIRSUB, y un anillo de pulso infinito alrededor de cada pin (escala 1 → 2.25, opacidad 0.8 → 0, 2 s, `ease-out`, con delay escalonado entre los 20 pines). Ese comportamiento no se toca. Sí se rediseña todo lo que lo rodea: el contenedor, el encabezado de sección, el degradé inferior, el tooltip, el modal de filial y los botones.
2. **Transición entre rutas.** Al navegar, la vista saliente se desplaza a la izquierda y se desenfoca mientras la entrante llega desde la derecha con un leve `scale`. Curva `cubic-bezier(0.25, 0.8, 0.25, 1)`, salida ~200 ms, entrada ~300 ms con 50 ms de delay. Se conserva la sensación; podés refinar distancias y easing.
3. **Arquitectura de información y contenido.** Mismas rutas, mismos textos, mismas secciones, mismos servicios y trámites. No inventes contenido nuevo ni elimines secciones.

---

## PALETA

Tiene que ser un contraste claro contra la paleta actual (verde `#00C768` plano + cian `#00b8db` en degradé de header + fondo blanco), **manteniendo el verde y el azul como familia dominante**, porque son la identidad institucional. La jugada es la misma familia cromática llevada a un registro mucho más profundo, con más contraste y una nota metálica cálida que aporta el aire institucional.

| Token | Valor | Uso |
|---|---|---|
| `--ink` | `#0A1F1A` | Texto principal, fondos oscuros de sección |
| `--forest` | `#0E3B2E` | Verde profundo institucional, superficies oscuras, footer |
| `--emerald` | `#12805C` | Verde de marca, botones primarios, acentos |
| `--jade` | `#2FBF8F` | Estados hover, resaltados, el pulso del mapa |
| `--abyss` | `#0B2C4D` | Azul profundo, secciones alternas, headers de tabla |
| `--steel` | `#1D4E6E` | Azul secundario, links, gráficos |
| `--gold` | `#C9A227` | Acento metálico discreto: filetes, numeración, detalles de insignia. Nunca más del 5% de la superficie |
| `--bone` | `#F7F9F8` | Fondo base |
| `--mist` | `#EDF2F0` | Superficies elevadas, separadores |
| `--slate` | `#6B7A76` | Texto secundario |

Reglas:
- Fondo claro por defecto en el sitio público. Usá bloques de fondo oscuro (`--forest` / `--abyss`) para separar secciones y crear ritmo, no degradés de esquina a esquina.
- El degradé cian→verde del header actual desaparece. Reemplazalo por color sólido o por un tratamiento tipográfico.
- Contraste mínimo WCAG AA (4.5:1 en texto de cuerpo, 3:1 en texto grande). El público objetivo incluye adultos mayores: cuerpo de texto no menor a 17 px en desktop.
- El panel administrativo va con la misma paleta pero admite modo oscuro como variante secundaria.

---

## TIPOGRAFÍA

Dos opciones; entregá la propuesta con la **A** y mostrame una muestra comparativa con la B.

- **A (editorial, recomendada):** títulos en una serif contemporánea de alto contraste (Fraunces, Newsreader o Instrument Serif) + cuerpo en Geist (ya está en el proyecto). La serif aporta la gravedad institucional que hoy falta.
- **B (corporativa):** todo en Geist con jerarquías por peso y tracking, más Geist Mono para datos, montos y códigos.

Definí escala tipográfica modular, alturas de línea, tracking por tamaño y anchos de medida (65–75 caracteres en texto largo).

---

## MOVIMIENTO

Debe haber mucha animación, pero toda al servicio de la lectura.

- Revelado por scroll con desplazamiento corto (16–24 px) y opacidad, escalonado en grillas.
- Hovers con intención: elevación sutil, subrayados que se dibujan, imágenes con leve zoom dentro de máscara.
- Parallax discreto en imágenes grandes.
- Números y contadores institucionales que animan al entrar en viewport (años de historia, filiales, socios).
- Todo respeta `prefers-reduced-motion`.
- Especificá para cada animación: duración, curva, delay y disparador.

---

## PANTALLAS A ENTREGAR — SITIO PÚBLICO

Cada pantalla en **desktop 1440**, **tablet 768** y **mobile 390**.

### 1. Componentes globales
- **Header desktop.** Logo CIRSUB, 8 ítems de navegación: Inicio, Nosotros (Resumen / Institucional / Autoridades), Servicios (Todos + 9 servicios), Trámites (Todos + 3 trámites), Novedades (nuevo), Filiales, Alojamiento, Recibos, Contacto. Necesito estado normal, estado con scroll (compactado), dropdown abierto con muchos ítems y ítem activo. Resolvé cómo se muestran los 10 ítems del dropdown de Servicios sin que parezca una lista de sistema operativo.
- **Header mobile.** Barra + drawer lateral con iconografía de línea por sección y submenús plegables.
- **Footer.** Cuatro columnas: Contacto (Sede Central Hotel Tacuarí, Tacuarí 566, CP 1071 CABA / afiliaciones@cirsubgn.org / 011 4342-3068 y 69), Información, Acceso Rápido, Redes (Facebook e Instagram). Rediseñalo como cierre institucional, no como pie gris.
- **Sistema de cards, botones, inputs, tabs, badges, breadcrumbs, paginación, tooltips, toasts, skeletons y estado vacío.**

### 2. Home
Orden de secciones, de arriba hacia abajo:

1. **Carrusel de novedades (hero).** Es la primera impresión del sitio. Cada slide es una novedad cargada por un administrador: una imagen sin texto embebido, un volanta corta, un título corto y una bajada breve, más un botón que lleva al detalle de esa novedad. Diseñá el tratamiento del texto sobre la imagen (máscara, bloque sólido, split screen) sabiendo que **la imagen nunca traerá texto propio**. Incluí indicadores de progreso, controles y comportamiento en autoplay. Definí y anotá los límites de caracteres que el diseño tolera: volanta, título y bajada. Mostrá el slide con título corto y con título en el límite máximo.
2. **Accesos directos.** Dos botones a sistemas externos: "Credencial Digital" (credencial.cirsubgn.org.ar) y "Sistema de Gestión" (admin.cirsubgn.org.ar). Hoy son dos botones sueltos; convertilos en un bloque con peso propio.
3. **Filiales + mapa.** Título "La mutual siempre cerca", bajada "Conocé nuestras 20 filiales desplegadas en todo el país", el mapa con los pines pulsantes (intacto), un carrusel de fotos de filiales y un botón "Conocer las filiales". Rediseñá contenedor, encabezado, carrusel de fotos y botón.
4. **Showcase de la Credencial Virtual (sección nueva, la pieza estrella).** Presentación scroll-driven de la app móvil de credencial, al estilo de cómo las marcas de electrónica presentan un producto:
   - Un mockup de iPhone fijo (sticky) mientras el texto avanza a un costado.
   - El teléfono rota levemente en 3D, se inclina y cambia de pantalla a medida que el usuario scrollea. Las capturas de la app se deslizan dentro de la pantalla.
   - A cada pantalla le corresponde un bloque de texto que entra y sale con transición: credencial digital del socio, datos del grupo familiar, beneficios y descuentos, red de comercios adheridos, novedades, y lo que surja de las capturas que te voy a pasar.
   - Cierre con un botón grande hacia la app web de la credencial.
   - Entregá el storyboard cuadro por cuadro: posición del teléfono, rotación, escala, pantalla activa y texto visible en cada tramo de scroll (0%, 25%, 50%, 75%, 100%), más la versión mobile de esa misma secuencia, donde el sticky lateral no funciona.
   - Dejá slots marcados para las capturas reales de la app.

### 3. Novedades (sección nueva)
- **Listado.** Grilla editorial de novedades con imagen, volanta, título, fecha y bajada. Necesita una novedad destacada, filtro por categoría, buscador, paginación o scroll infinito, y estados de carga y vacío.
- **Detalle de novedad.** Es la contraparte del slide del carrusel: la nota completa. Diseñá una plantilla de lectura larga, generosa, tipo revista digital, que soporte todo lo que el editor de texto enriquecido puede producir: títulos de nivel 2 y 3, párrafos, negrita, cursiva, subrayado, texto de color, citas destacadas, listas, enlaces, imágenes a ancho de columna y a ancho completo, galerías, video embebido, tablas y separadores. Incluí encabezado con imagen de portada, fecha, autor institucional, tiempo de lectura, barra de progreso de lectura, botones de compartir y un bloque de "novedades relacionadas" al pie.
- Entregá un artboard adicional con el **catálogo de estilos del contenido enriquecido** (cómo se ve cada elemento que el editor puede generar), porque va a ser la guía de estilos del editor.

### 4. Nosotros
- **Resumen.** Título "¿Quiénes somos?", párrafo institucional y tres accesos: Institucional, Autoridades, Filiales.
- **Institucional.** Documento de lectura: "Constitución y Finalidades", un párrafo de constitución y una lista de 6 finalidades (agrupar asociados, asistencia farmacéutica, proveeduría/seguros/turismo/sepelios, subsidios, asistencia jurídica, asistencia financiera). Hoy es un bloque blanco con viñetas. Convertilo en una pieza editorial con jerarquía real.
- **Autoridades.** Organigrama del Honorable Consejo Directivo. Jerarquía: Presidente → Vicepresidente → cuatro ramas (Secretaría con Secretario y Pro Secretario; Tesorería con Tesorero y Pro Tesorero; Vocales Titulares con 3 integrantes; Junta Fiscalizadora con 5 integrantes). Todos son "Suboficial Mayor (R)" con foto de retrato. Rediseñá el organigrama completo, incluyendo cómo se dibujan los conectores y cómo colapsa en mobile, más el estado de foto faltante.

### 5. Servicios
- **Índice "Bienestar Social y Servicios".** Nueve servicios: Asesoramiento Contable, Asesoramiento Jurídico, Beneficios Bodas de Oro, Subsidio por Casamiento, Subsidio por Hijo, Subsidio por Sepelio, Turismo, Farmacia, Evacuación. Cada uno tiene una ilustración de línea propia. Rediseñá la grilla y la card.
- **Plantilla de página de servicio.** Una sola plantilla sirve para los 9. Estructura de contenido: título, subtítulo opcional, ilustración o imagen, y bloques que pueden ser párrafo, título de sección, lista con viñetas, párrafo destacado (hoy un recuadro verde con borde izquierdo) y un botón de acción opcional. Entregá la plantilla con los cinco tipos de bloque y dos ejemplos poblados: Asesoramiento Jurídico (corto) y Turismo (largo).
- Definí también el **sistema de ilustraciones de línea** que reemplaza a las actuales: mismo grosor de trazo, mismo lenguaje geométrico, aplicable a los 9 servicios, 3 trámites y 15 departamentos de contacto.

### 6. Trámites
- **Índice.** Tres trámites con descripción: Afiliación ("Asociate a la mutual y disfrutá de todos los beneficios"), Actualización de datos ("Mantené tus datos personales al día"), Alta Familiar ("Sumá familiares directos a tu cobertura").
- Usan la misma plantilla de página informativa que los servicios.

### 7. Filiales
Página propia con el mapa a pantalla completa. Rediseñá:
- El encabezado ("Nuestras Filiales" / "Encontrá la filial más cercana").
- El tooltip al pasar sobre un pin.
- El **modal de filial**, que hoy es un cuadro blanco redondeado con sombra: foto de la filial, nombre, dirección, teléfono, email y cierre. Rediseñalo por completo, con animación de apertura y cierre.
- Un listado alternativo de las 20 filiales, buscable y agrupado por región, para quien no quiere usar el mapa.
- Las 20 filiales son: Sede Central CABA, San Miguel, Mar del Plata, Jesús María, Córdoba Capital, Resistencia, Corrientes Capital, Concepción del Uruguay, Eldorado, Oberá, Posadas, Formosa Capital, Orán, Salta Capital, Río Gallegos, Comodoro Rivadavia, Neuquén Capital, Mendoza Capital, Tunuyán y San Juan Capital.

### 8. Contacto
Quince departamentos con nombre, email, y a veces teléfono e interno: Administración Hotel, Bienestar Social, Comunicación y Prensa, Contaduría, Evacuaciones, Farmacia, Junta Electoral, Junta Fiscalizadora, Legales, Presidencia, Presupuesto, Protocolo y Ceremonial, Recepción, Recursos Humanos, Secretaría. Hoy son 15 cards iguales en grilla. Buscá una solución con mejor jerarquía y escaneabilidad, con buscador o filtro. Sumá un bloque de sede central con dirección y horarios.

### 9. Recibos
Dos accesos a portales externos: "Retirados y Pensionados" (Caja de Retiros, Jubilaciones y Pensiones de la Policía Federal) y "Personal en Actividad" (portal SERPEGEN de Gendarmería Nacional). Necesitan señalizar claramente que llevan fuera del sitio.

### 10. Alojamiento
Página informativa sobre el Hotel Tacuarí, con la misma plantilla de contenido. Merece tratamiento con más imagen que las demás.

### 11. Error 404
Con la identidad del rediseño.

---

## PANTALLAS A ENTREGAR — AUTENTICACIÓN Y PANEL ADMINISTRATIVO

El sitio pasa de estático a dinámico. Habrá un backend con usuarios administradores, permisos por módulo y carga de contenido. El acceso es **solo por invitación**: el superadministrador invita por email, la persona recibe un enlace, define su contraseña y entra. No hay registro público.

### 12. Autenticación
- **Login.** Email y contraseña, "olvidé mi contraseña", errores de credencial inválida, cuenta bloqueada e intentos excedidos. Diseñá el layout completo, no un formulario centrado genérico.
- **Activación de cuenta por invitación.** Pantalla a la que se llega desde el email: bienvenida con nombre y rol asignado, creación de contraseña con medidor de fortaleza y requisitos visibles, confirmación de contraseña, aceptación de términos.
- **Enlace de invitación vencido o inválido.**
- **Recuperar contraseña** (pedido) y **restablecer contraseña** (desde el enlace).
- **Verificación en dos pasos por código** (dejala diseñada aunque se implemente después).
- **Plantilla de email de invitación** y **plantilla de email de recuperación**, en HTML, con la identidad nueva.

### 13. Estructura del panel
- Layout con barra lateral, navegación por módulos, barra superior con buscador, notificaciones y menú de usuario, y área de contenido. Estados: sidebar expandido, sidebar colapsado, y la versión mobile.
- **La navegación es sensible a permisos:** un administrador solo ve los módulos que puede tocar. Mostrame la sidebar de un superadministrador (todos los módulos) y la de un administrador con dos permisos.
- **Dashboard de inicio.** Métricas (novedades publicadas, borradores, visitas, socios), últimas novedades, actividad reciente del equipo y accesos rápidos.

### 14. Módulo Novedades
- **Listado.** Tabla o grilla con miniatura, título, estado (borrador, programada, publicada, archivada), autor, fecha, orden en el carrusel y acciones. Con filtros, buscador, selección múltiple y acciones en lote.
- **Editor de novedad.** Es la pantalla más importante del panel. Tiene que resolver, en una sola vista, dos cosas distintas:
  1. **El resumen que va al carrusel del home:** subida de la imagen del slide, con recorte y encuadre, más los campos de texto corto. Cada campo con contador de caracteres visible y advertencia al acercarse al límite, porque un texto largo rompe el diseño del carrusel. **Junto al formulario tiene que haber una previsualización en vivo del slide tal como se verá en el home.**
  2. **La nota completa:** editor de texto enriquecido con barra de herramientas completa: encabezados, negrita, cursiva, subrayado, tachado, color de texto y resaltado, alineación, listas ordenadas y con viñetas, cita, código, enlace, tabla, separador, insertar imagen, insertar video (YouTube, Vimeo o archivo) y deshacer/rehacer. Diseñá la barra en desktop y su versión compacta en mobile, más los popovers de enlace, de color y de inserción de medios, y el menú flotante de selección de texto.
- **Aviso explícito en el diseño:** la imagen del carrusel no debe contener texto embebido. Ese aviso tiene que estar en la interfaz de subida, no en un manual.
- Además: barra lateral de publicación (estado, fecha programada, categoría, destacada, slug, imagen de portada), guardado automático con indicador, historial de versiones, y previsualización de la nota completa antes de publicar.
- **Biblioteca de medios.** Grilla de imágenes y videos, subida por arrastre con progreso, buscador, filtros, detalle de archivo con texto alternativo y datos técnicos, y selector modal para insertar desde el editor.

### 15. Módulo Carrusel
Administración del orden y la vigencia de los slides del home: reordenamiento por arrastre, activar y desactivar, vigencia por fechas, y una previsualización del carrusel completo tal como quedará.

### 16. Otros módulos de contenido
Cada uno con listado, formulario de alta y edición, y confirmación de borrado:
- **Contactos:** los 15 departamentos, con nombre, email, teléfono, interno e ícono.
- **Autoridades:** integrantes con foto, nombre, rango, cargo y posición en el organigrama.
- **Filiales:** nombre, dirección, teléfono, email, coordenadas y foto.
- **Servicios y Trámites:** edición de las páginas informativas por bloques (párrafo, título, lista, destacado) con reordenamiento.

### 17. Módulo Usuarios y Permisos (solo superadministrador)
Es un requisito central: el superadministrador delega el mantenimiento del sitio repartiendo permisos por módulo.
- **Listado de administradores** con nombre, email, rol, estado (activo, invitado pendiente, suspendido), último acceso y permisos resumidos.
- **Invitar administrador:** nombre, email, y asignación de permisos en el mismo paso.
- **Matriz de permisos.** El corazón del módulo: filas por módulo (Novedades, Carrusel, Contactos, Autoridades, Filiales, Servicios y Trámites, Medios, Usuarios) y columnas por acción (ver, crear, editar, eliminar, publicar). Diseñá la matriz para desktop y resolvé cómo se lee en mobile. Sumá roles predefinidos (Editor de Novedades, Editor de Contenido Institucional, Solo Lectura) que precargan la matriz, más la opción de personalizar.
- **Detalle de administrador** con sus permisos y su actividad.
- **Registro de auditoría:** quién hizo qué, cuándo y sobre qué contenido, con filtros.
- **Perfil propio:** datos, foto, cambio de contraseña, sesiones activas.

### 18. Estados y patrones del panel
- Carga con esqueletos, listado vacío, error de servidor, sin permisos.
- Diálogos de confirmación, con una variante específica para acciones destructivas.
- Notificaciones tipo toast: éxito, error, advertencia, información.
- Validación de formularios: campo con error, campo válido, ayuda contextual.
- Indicador de guardado automático y aviso de cambios sin guardar.

---

## ENTREGABLES

1. **Artboard de fundamentos:** paleta con tokens y sus usos, escala tipográfica, escala de espaciado, radios, sombras, grillas y breakpoints (390 / 768 / 1024 / 1440), e iconografía.
2. **Artboard de componentes:** cada componente con todos sus estados (normal, hover, foco, activo, deshabilitado, cargando, error).
3. **Las pantallas de las secciones 1 a 18**, en desktop y mobile.
4. **Especificación de movimiento:** tabla con cada animación, su disparador, duración, curva y delay. Con el storyboard completo del showcase de la Credencial Virtual.
5. **Guía de estilos del contenido enriquecido**, para que el editor del panel produzca notas coherentes con el diseño.
6. **Notas de implementación:** el sitio es Angular 20 con Tailwind CSS 4. Entregá los tokens listos para volcar a variables CSS y a la configuración de Tailwind.

## CÓMO QUIERO QUE TRABAJES

- Antes de dibujar, mostrame **tres direcciones visuales distintas** de la home, cada una con su lógica propia (por ejemplo: editorial serif, institucional geométrica, contemporánea con bloques oscuros). Elijo una y seguís con esa.
- Justificá cada decisión con una frase: por qué esa jerarquía, por qué ese contraste, por qué ese movimiento.
- Nada de texto de relleno: usá los textos reales que están en este brief.
- Diseñá para adultos mayores sin que parezca diseñado para adultos mayores: contraste alto, áreas táctiles generosas, tipografía cómoda, sin sacrificar sofisticación.
