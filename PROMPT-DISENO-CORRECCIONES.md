# Prompt de correcciones para Claude Design — Ronda 2

> Pegá todo lo que sigue (desde "CONTEXTO") en la misma conversación de Claude Design donde está el canvas.
> Antes de enviarlo, capturá y adjuntá estas pantallas de la app de Credencial Virtual que todavía no tenemos: el **menú lateral desplegado** (el de la hamburguesa) y la pantalla a la que lleva el botón **Administrar**. Sin ellas, el storyboard queda con dos huecos.

---

## CONTEXTO

El sistema de diseño está aprobado tal como está: paleta de la Credencial Virtual, Outfit y Figtree, ondas, radios blandos. **No cambies nada de eso.** Esta ronda es para cerrar tres huecos concretos contra el brief original y arreglar dos defectos puntuales. Todo lo demás del canvas queda como está.

---

## HUECO 1 — El showcase de la Credencial Virtual (prioridad máxima)

En `home-v2-moderna.dc.html`, la sección de la Credencial Virtual quedó resuelta como un bloque estático: un teléfono que flota, cuatro chips de texto y un botón. El brief pedía otra cosa, y es la pieza central del rediseño.

**Lo que hay que diseñar:** una presentación guiada por scroll, del tipo que usan las marcas de electrónica para presentar un producto. El usuario scrollea y el teléfono se queda quieto mientras el contenido de su pantalla y el texto de al lado van cambiando.

### Comportamiento en desktop

- El teléfono queda **sticky** en una columna, centrado verticalmente, durante toda la sección. La sección tiene la altura de varias pantallas.
- El teléfono **rota levemente en 3D** a medida que avanza el scroll: arranca inclinado, se endereza en el tramo central y vuelve a inclinarse al final. Rango sugerido: `rotateY` de -14° a +14°, `rotateX` de 6° a -6°, más un `translateY` de flotación. Nada brusco.
- **Dentro de la pantalla del teléfono**, las capturas de la app se van reemplazando con un deslizamiento vertical y un cross-fade corto.
- En la otra columna, cada captura tiene su bloque de texto: un título corto y dos o tres líneas. El bloque entra desde abajo con opacidad y sale hacia arriba desvaneciéndose. Solo uno visible por vez.
- Al final de la secuencia, el teléfono se achica y se centra, y aparece el botón grande hacia la app web de la credencial.

### Los tramos del storyboard

Usá las capturas reales que están en `uploads/`. Esto es lo que muestra cada una:

1. **Tu credencial, siempre encima.** Pantalla principal: foto del socio, nombre, DNI, condición de socio y código QR sobre una tarjeta con el degradé de marca. La tarjeta se da vuelta con el botón de la esquina. Es la captura `pasted-1789007965781-0.png`.
2. **Beneficios que se consultan en el momento.** Pantalla de Farmacia: dice si el socio tiene el beneficio activo y ofrece contacto directo por WhatsApp. Es `pasted-1789007998504-0.png`.
3. **Tus coberturas, en una lista.** Pantalla de Seguros: seguro de sepelio y seguro de vida, cada uno con su estado de contratación. Es `pasted-1789008038465-0.png`.
4. **Todo el círculo en un menú.** Slot reservado para la captura del menú lateral, que te voy a pasar.
5. **Gestioná tus datos.** Slot reservado para la captura de la pantalla "Administrar", que te voy a pasar.
6. **Cierre:** "Instalala en tu teléfono" más el botón hacia `credencial.cirsubgn.org.ar`. La app se instala como aplicación desde el navegador, no se baja de una tienda; decilo sin tecnicismos.

### Lo que tenés que entregar

- La sección completa dibujada, con el estado de cada tramo visible como artboards separados: 0%, 25%, 50%, 75% y 100% de avance del scroll.
- Una **tabla de especificación de la animación**: para cada tramo, la posición del teléfono, su rotación en los tres ejes, su escala, qué captura está en pantalla, qué texto está visible, y las curvas y duraciones de cada transición.
- La **versión mobile**, donde la columna sticky al costado no funciona. Resolvela: puede ser el teléfono sticky arriba con el texto pasando por debajo, o un carrusel horizontal por pasos. Elegí una y justificala.
- El comportamiento con `prefers-reduced-motion`: sin rotación ni sticky, las cinco pantallas apiladas con su texto.

---

## HUECO 2 — El editor de novedad no separa el carrusel de la nota

En `09-panel-editor.dc.html`, el editor tiene título, bajada, cuerpo, un interruptor de "Mostrar en el carrusel" y una imagen de portada. Le falta lo que más importa del módulo.

Una novedad son **dos piezas distintas** y el editor tiene que hacerlo evidente:

- **El resumen** que se ve como slide en el carrusel de la home.
- **La nota completa** que se ve en su propia página.

### Lo que hay que agregar

**Un bloque "Resumen para el carrusel" separado visualmente del cuerpo de la nota**, con:

- Subida de la **imagen del slide**, con recorte a la proporción del carrusel y encuadre ajustable.
- **Un aviso permanente en la zona de subida, no en un tooltip:** la imagen no debe contener texto. El texto va en los campos de abajo. Si la imagen trae texto embebido, el slide se rompe en mobile y el texto queda ilegible. Diseñá ese aviso con jerarquía suficiente para que nadie lo saltee, sin que parezca un error.
- Tres campos con **contador de caracteres visible**, en formato `28 / 42`:
  - Volanta, máximo 24 caracteres.
  - Título del slide, máximo 42 caracteres.
  - Bajada del slide, máximo 140 caracteres.
- Los contadores cambian de color al llegar al 85% del límite y bloquean el ingreso al llegar al 100%. Dibujá los tres estados: normal, cerca del límite, en el límite.
- Texto de ayuda bajo cada campo explicando por qué existe el límite.

**Una previsualización en vivo del slide**, al lado del formulario, que muestre exactamente cómo se va a ver en la home con la imagen y los textos cargados. Tiene que actualizarse mientras se escribe. Dibujá la previsualización en su versión desktop y con un conmutador para verla en mobile.

**Mostrá dos estados del bloque completo:** uno con textos cortos y otro con los tres campos en el límite máximo, para probar que el diseño aguanta.

### Además, en la barra de herramientas del editor de texto

El brief pedía la barra completa y quedó incompleta. Tiene que incluir y estar dibujada: encabezados de nivel 2 y 3, negrita, cursiva, subrayado, tachado, color de texto, resaltado, alineación, lista ordenada, lista con viñetas, cita, bloque de código, enlace, tabla, separador, insertar imagen, insertar video e deshacer y rehacer.

Dibujá también los tres popovers que faltan: el de insertar enlace, el selector de color y el de insertar video con pegado de URL de YouTube o Vimeo. Más el menú flotante que aparece al seleccionar texto, y la versión compacta de la barra para pantallas chicas.

---

## HUECO 3 — Faltan las versiones mobile

Solo la home y la pantalla de filiales tienen tratamiento responsive. El resto está dibujado únicamente a 1440. El sitio lo van a usar mayoritariamente desde el teléfono.

Entregá a **390 de ancho**:

**Sitio público:** listado de novedades, detalle de novedad, Nosotros con el organigrama del Consejo Directivo colapsado, índice de servicios, plantilla de página de servicio, índice de trámites, contacto con sus quince departamentos, recibos de haberes, alojamiento y el error 404.

**Panel administrativo:** el ingreso, el tablero con la navegación en cajón lateral, el listado de novedades, el editor de novedad completo con el bloque de carrusel, la biblioteca de medios, el listado de usuarios y, sobre todo, **la matriz de permisos**, que es la que peor sobrevive a una pantalla angosta. Resolvela de verdad: doce permisos por cinco roles no entran en una tabla de 390 píxeles. Proponé una vista por rol, o un acordeón por módulo, o lo que funcione, y explicá por qué.

**Componentes:** la barra de navegación pública en cajón lateral con sus submenús plegables, y el modal de ficha de filial a pantalla completa.

---

## DOS DEFECTOS PUNTUALES

1. En `home-v2-moderna.dc.html`, el título de la sección de credencial dice **"Una app, todo lo que neceitas a la mano"**. Falta la "s": es "necesitas".
2. En `10-panel-usuarios.dc.html`, sección 10.3, la ficha de usuario tiene el avatar con las iniciales **cortado por la onda del encabezado**. Se ve solo la mitad superior de las letras. Subí el avatar o bajá la onda para que el círculo quede completo y con su anillo blanco visible.

---

## CÓMO ENTREGARLO

Actualizá los archivos que ya existen en lugar de crear artboards nuevos sueltos, salvo los del storyboard del showcase, que van en un archivo propio porque son cinco cuadros más la tabla de especificación. Sumá ese archivo al índice.
