# Plan técnico — CIRSUB dinámico

Decisiones tomadas: monorepo, panel dentro del mismo Angular bajo `/admin`, API en `apipage.cirsubgn.org.ar`, archivos en disco del servidor Debian con migración posterior a un NAS, correo por Nodemailer sobre Google Workspace, editor TipTap.

Alcance acotado: **el padrón de socios no entra acá**. Las afiliaciones, la credencial y los trámites se gestionan en el sistema que ya existe. El sitio web solo informa y facilita el contacto.

---

## 1. Estructura del monorepo

El repositorio actual ya es la aplicación Angular. Se convierte en monorepo moviendo lo que hay a `apps/web`.

```
cirsubpage/
├── apps/
│   ├── web/                 Angular 20 con SSR (el src actual, movido)
│   └── api/                 NestJS
├── packages/
│   └── shared/              tipos y contratos compartidos por las dos apps
├── docker/
│   ├── web.Dockerfile
│   ├── api.Dockerfile
│   └── nginx/
├── compose.yaml
├── compose.prod.yaml
└── package.json             workspaces de npm
```

`packages/shared` es la pieza que hace que el monorepo valga la pena. Ahí viven los tipos de las entidades, los objetos de transferencia y, sobre todo, **el catálogo de permisos y los estados de la novedad como constantes tipadas**. El backend los usa para proteger rutas y el frontend para decidir qué muestra. Una sola fuente de verdad, sin cadenas de texto sueltas en los dos lados.

Se usan workspaces de npm, que ya vienen con la versión de Node que corre Angular 20. No hace falta Nx ni Turborepo para dos aplicaciones.

**Punto de atención.** El Angular actual tiene renderizado en servidor activado, con `outputMode: server` y un `server.ts` con Express. No es un sitio estático: en producción corre como proceso Node. Eso es bueno para el posicionamiento en buscadores de las novedades, pero significa que el contenedor de la web es un servidor, no un nginx sirviendo archivos.

---

## 2. Dominios

| Nombre | Qué sirve | Estado |
|---|---|---|
| `cirsubgn.org.ar` | Angular con renderizado en servidor, público y `/admin` | a desplegar |
| `apipage.cirsubgn.org.ar` | NestJS | a desplegar |
| `cirsubgn.org` | dominio de correo de Google Workspace | ya existe |

Los dos dominios conviven a propósito: el sitio vive en `.org.ar` y las casillas en `.org`. No hay que unificarlos, solo tenerlo presente al configurar el envío y los registros de autenticación de correo.

Como el panel vive en `/admin` dentro del mismo origen que el sitio público, no hay problema de origen cruzado para la navegación. Sí lo hay entre el sitio y la API, que están en subdominios distintos. Se resuelve así:

- Origen permitido explícito en la API, solo el dominio del sitio. Nada de comodines.
- La cookie de refresco se emite con `Domain=.cirsubgn.org.ar`, `HttpOnly`, `Secure` y `SameSite=Lax`. Al compartir dominio de segundo nivel, viaja sin fricción.
- El token de acceso no se guarda en `localStorage`. Vive en memoria y se renueva contra la cookie.

---

## 3. Autenticación

No hay registro público. El circuito completo es:

1. Quien tenga permiso crea la invitación con nombre, correo, rol y filial si corresponde.
2. La API genera 32 bytes aleatorios, guarda **solo el hash** del token y manda el correo con el enlace.
3. La invitación vence a las 72 horas y es de un solo uso.
4. La persona abre el enlace, define su contraseña y queda activa.

Detalles que importan:

- **Hash de contraseña con Argon2id.** Es el estándar actual y NestJS lo integra sin fricción.
- **Token de acceso** de vida corta, quince minutos, firmado y devuelto en el cuerpo de la respuesta.
- **Token de refresco** de siete días, rotado en cada uso, guardado hasheado en base con su agente de usuario e IP. Si se detecta reutilización de un token ya rotado, se revoca toda la familia. Eso convierte un robo de cookie en una sesión muerta.
- **Verificación en dos pasos** por código de tiempo, la que ya está diseñada. Se deja el campo y la pantalla desde el principio, se activa cuando quieras.
- **Límite de intentos** por correo y por IP en el ingreso, en el pedido de recuperación y en el canje de invitación.

---

## 4. Roles y permisos

El modelo tiene tres piezas:

- **Catálogo de permisos**, fijo, con formato `modulo.accion`.
- **Roles** que agrupan permisos, cada asignación con su alcance, `todos` o `propio`. El alcance propio es lo que permite que un referente edite lo suyo y no lo de las otras diecinueve filiales.
- **Excepciones por usuario**, que suman o restan sobre lo que trae el rol. Sin esto, cada pedido puntual del estilo "a este dejalo tocar también los contactos" obliga a inventar un rol nuevo.

### Los roles

| Rol | Qué hace |
|---|---|
| Superadministrador | Todo. Sos vos. Único que crea otros administradores. |
| Administrador de usuarios | Da de alta referentes de filial. Nada más. |
| Editor de novedades | Revisa lo que mandan los referentes, aprueba o rechaza, publica y administra el carrusel. |
| Referente de filial | Crea novedades de su filial y las envía a revisión. Edita la ficha de su filial. |
| Prensa | Crea y publica directo, sin pasar por revisión. Sede central. |
| Lectura | Consulta el tablero y la auditoría. No modifica nada. |

### El catálogo de permisos

```
tablero.ver
novedades.crear          alcance propio para el referente
novedades.enviar         manda a revisión
novedades.revisar        aprobar o rechazar con motivo
novedades.publicar       publicar sin revisión previa
novedades.eliminar
carrusel.editar
medios.subir             alcance propio para el referente
filiales.editar          alcance propio para el referente
autoridades.editar
contactos.editar
paginas.editar           servicios, trámites e institucional
usuarios.invitar
usuarios.administrar     suspender, cambiar rol, cambiar permisos
auditoria.ver
```

En la API se resuelve con un decorador sobre el controlador y un guardia que evalúa permiso y alcance. En Angular, una directiva estructural que muestra u oculta según los permisos que trae la sesión. El frontend oculta por comodidad; **quien decide siempre es el backend**.

### Un detalle de seguridad que no es opcional

Vas a delegar el alta de usuarios en un administrador de usuarios. Si ese permiso no tiene límite, esa persona puede crear un superadministrador y quedarse con el sitio.

Por eso cada rol lleva una lista explícita de **qué roles puede asignar**. El administrador de usuarios solo puede invitar referentes de filial. El superadministrador puede invitar a cualquiera. Nadie puede invitar a un rol de más poder que el suyo, ni siquiera al propio. Es una línea de código y evita el único agujero grave que tiene este modelo.

---

## 5. Circuito editorial de las novedades

Esta es la parte nueva y la que más define el módulo. Una novedad recorre estados y cada transición tiene un dueño.

```
                 ┌──────────┐
                 │ borrador │ ◀────────────────┐
                 └────┬─────┘                  │
        el referente  │ envía                  │ corrige
                      ▼                        │
              ┌───────────────┐                │
              │ en revisión   │                │
              └───┬───────┬───┘                │
      aprueba     │       │   rechaza con      │
                  │       │   motivo           │
                  ▼       ▼                    │
          ┌───────────┐  ┌──────────────────┐  │
          │ publicada │  │ cambios pedidos  │──┘
          └─────┬─────┘  └────────┬─────────┘
                │ archiva         │ desiste
                ▼                 ▼
          ┌──────────┐      ┌───────────┐
          │ archivada│      │ cancelada │
          └──────────┘      └───────────┘
```

Quién puede hacer cada cosa:

- **El referente** pasa de borrador a en revisión, corrige cuando le piden cambios y vuelve a enviar, o cancela y abandona la propuesta. Nunca publica.
- **El editor de novedades** aprueba, y ahí la novedad queda viva en el sitio, o rechaza escribiendo un motivo. También archiva lo que ya se publicó.
- **Prensa** salta el circuito: crea y publica en un paso, porque es la sede central.

Reglas que se cumplen en el backend, no en la pantalla:

- El motivo del rechazo es obligatorio. Sin texto no hay rechazo.
- Cada vuelta queda registrada. El referente ve el historial completo de revisiones, no solo el último comentario. Si una novedad fue y volvió tres veces, se ven las tres.
- Una novedad en revisión queda bloqueada para el referente. No puede editarla mientras está en el escritorio del editor.
- El referente solo ve y toca las novedades de su filial. Eso es el alcance propio.

Avisos, en los dos sentidos:

- Cuando el referente envía, le llega un correo al editor de novedades y le aparece el aviso en la campana del panel.
- Cuando el editor aprueba o rechaza, le llega el correo al referente con el motivo incluido.
- Todo queda además en el registro de auditoría.

---

## 6. Esquema de base de datos

PostgreSQL. Identificadores de tipo `uuid`. Fechas con zona horaria.

### Identidad y seguridad

```
roles              id, slug, nombre, descripcion, es_sistema, nivel
role_assignable    role_id, puede_asignar_role_id
permissions        id, slug, modulo, accion, descripcion
role_permissions   role_id, permission_id, alcance('todos'|'propio')
users              id, email, nombre, password_hash, role_id, filial_id,
                   estado('invitado'|'activo'|'suspendido'), totp_secret,
                   totp_habilitado, ultimo_acceso, created_at, updated_at
user_permissions   user_id, permission_id, alcance, concedido
invitations        id, email, role_id, filial_id, token_hash, invitado_por,
                   expira_en, usado_en, created_at
password_resets    id, user_id, token_hash, expira_en, usado_en
refresh_tokens     id, user_id, token_hash, familia_id, expira_en,
                   revocado_en, user_agent, ip
audit_log          id, user_id, accion, entidad, entidad_id, resumen,
                   datos jsonb, ip, created_at
notificaciones     id, user_id, tipo, titulo, cuerpo, enlace, leida_en, created_at
```

### Medios

```
media              id, storage_key, nombre_original, mime, bytes, ancho, alto,
                   alt, subido_por, filial_id, created_at
media_variants     id, media_id, variante, storage_key, ancho, alto, formato
```

`storage_key` es una ruta relativa, nunca una dirección completa. Ese detalle es el que después permite mudar todo al NAS cambiando configuración y no datos.

### Novedades

```
categorias         id, slug, nombre, orden
novedades          id, slug,
                   estado('borrador'|'en_revision'|'cambios_pedidos'|
                          'publicada'|'archivada'|'cancelada'),

                   -- resumen que sale en el carrusel
                   volanta            varchar(24)
                   titulo_slide       varchar(42)
                   bajada_slide       varchar(140)
                   imagen_slide_id    -> media
                   en_carrusel        boolean
                   orden_carrusel     integer
                   carrusel_desde     timestamptz
                   carrusel_hasta     timestamptz

                   -- la nota completa
                   titulo, bajada, cuerpo_html, cuerpo_json jsonb,
                   portada_id -> media, categoria_id,

                   -- autoría y circuito
                   autor_id, filial_id, enviada_en, revisada_por,
                   revisada_en, publicada_en, created_at, updated_at

novedad_revisiones id, novedad_id, revisor_id,
                   accion('aprobada'|'cambios_pedidos'),
                   motivo text, created_at
novedad_versiones  id, novedad_id, snapshot jsonb, autor_id, created_at
```

Los límites de caracteres van **también como restricción en la base**, no solo en el formulario. Es la única forma de garantizar que el carrusel no se rompa si mañana alguien carga por otra vía.

El cuerpo se guarda dos veces a propósito: el JSON de TipTap es la fuente de verdad y permite volver a editar con fidelidad; el HTML ya saneado es lo que el renderizado en servidor escupe sin trabajo extra. El saneado se hace **al escribir, en el backend**, con una lista blanca estricta de etiquetas y atributos. Nunca se confía en lo que manda el navegador, y menos viniendo de veinte filiales.

### Contenido institucional

```
filiales           id, nombre, direccion, telefono, email, lat, lng,
                   svg_x, svg_y, foto_id, orden, activa
autoridades        id, nombre, rango, cargo, grupo, orden, foto_id, reporta_a
contactos          id, nombre, email, telefono, interno, icono, orden
paginas_info       id, slug, tipo('servicio'|'tramite'|'institucional'),
                   titulo, subtitulo, icono, imagen_id,
                   cta_texto, cta_enlace, cta_externo, orden
paginas_bloques    id, pagina_id, tipo('parrafo'|'titulo'|'lista'|'destacado'),
                   contenido, items jsonb, orden
```

`paginas_info` con sus bloques replica exactamente la estructura que ya tenés en `info-pages.data.ts`. La migración de esas doce páginas es un volcado directo, sin reinterpretar nada.

`svg_x` y `svg_y` son opcionales. El mapa proyecta latitud y longitud a coordenadas del dibujo por regla de tres, pero el código actual tiene rastros de calibración manual. Dejar el par de campos permite corregir un pin puntual sin tocar la proyección.

---

## 7. Almacenamiento de archivos

La clave es no atarse al disco desde el primer día, porque ya sabés que vas a mudarte al NAS.

- Una interfaz de almacenamiento con dos operaciones, guardar y leer, y una implementación de disco local.
- En la base solo se guarda la clave relativa. La dirección pública se arma al momento de responder.
- Los archivos se sirven por el nginx del sistema desde el volumen, no por Node. Node solo recibe la subida.
- Al subir una imagen se generan las variantes con `sharp`: el recorte 4:3 del carrusel en tres anchos, la portada de la nota y una miniatura, en WebP y AVIF con respaldo en JPEG.
- Cuota por filial y límite de tamaño por archivo, porque van a subir veinte personas distintas.

**Mudanza al NAS.** Se monta el NAS por red en el mismo punto del sistema de archivos y se copian los archivos. Ni la base ni el código cambian. Si más adelante el NAS habla el protocolo de S3, se escribe una segunda implementación de la interfaz y se cambia una variable de entorno.

---

## 8. Correo

Nodemailer contra el relé de Google Workspace, `smtp.gmail.com` por el puerto 587 con STARTTLS. El dominio de las casillas es `cirsubgn.org`.

Hacen falta dos cosas y conviene saberlo antes: una casilla dedicada del estilo `noreply@cirsubgn.org` y, sobre esa casilla, verificación en dos pasos activa más una contraseña de aplicación. Google ya no acepta la contraseña normal de la cuenta desde una aplicación. La alternativa es autenticación por token con delegación en todo el dominio, más trabajo de configurar pero sin contraseña en el archivo de entorno. Para este volumen, la contraseña de aplicación alcanza.

El límite de Workspace es de dos mil mensajes por día. Con invitaciones, recuperaciones y avisos del circuito editorial, sobra.

Correos que manda el sistema:

1. Invitación a crear la cuenta.
2. Recuperación de contraseña.
3. Aviso al editor de que hay una novedad esperando revisión.
4. Aviso al referente de que su novedad fue aprobada.
5. Aviso al referente de que le piden cambios, con el motivo incluido.

Las plantillas salen del entregable de diseño. Se compilan a HTML con tablas y estilos en línea, que es lo único que interpretan bien todos los clientes de correo, y cada una lleva su versión en texto plano.

---

## 9. Despliegue sobre el Debian actual

### Lo que ya hay

El servidor tiene nginx instalado en el sistema operativo y catorce contenedores corriendo. Los nombres de los archivos de sitio no coinciden con los dominios que sirven, así que conviene dejarlo escrito:

| Archivo en `sites-enabled` | Dominio que sirve | Hacia dónde va |
|---|---|---|
| `cirsubapp` | `cirsubgn.org.ar` y `www` | `127.0.0.1:3005`, y además el repositorio git bajo `/git` |
| `app.cirsubgn.org.ar` | `credencial.cirsubgn.org.ar` | `localhost:4200`, contenedor `cirsubfrontend-prod` |

El sitio actual vive en este equipo, detrás de nginx, en el puerto 3005, pero **no como contenedor**: es un proceso suelto del sistema. Eso se termina acá.

### El modelo al que vamos

La web nueva se sirve igual que la credencial: **contenedor del compose, con el nginx del sistema haciendo de intermediario**. Nada de procesos sueltos. El proceso del 3005 se apaga y se desinstala, no se conserva.

**Nuestro compose no levanta su propio nginx ni toca los puertos 80 y 443.** Publica en la interfaz local y el nginx del sistema proxea, que es el patrón que ya usan la credencial y los contenedores de staging.

Una mejora sobre cómo está hoy la credencial: ese contenedor publica en `0.0.0.0:4200`, o sea que el puerto queda accesible desde fuera del equipo si el cortafuegos no lo tapa. Los nuestros se atan a `127.0.0.1`, así la única puerta de entrada es nginx.

El archivo `cirsubapp` tiene dos cosas que hay que conservar al reemplazarlo: `client_max_body_size 50M`, que necesitamos para subir imágenes, y un servidor git con autenticación básica bajo `/git`, que además nos sirve como remoto de despliegue. El archivo pasa a llamarse como el dominio, `cirsubgn.org.ar`, y el viejo se desactiva. Los certificados no se mueven: viven en `/etc/letsencrypt` y no dependen del nombre del archivo del sitio.

### Puertos

Ocupados hoy: 1194, 3000, 3001, 3002, 3003, 3004, 3005, 3010, 3011, 4200, 4300, 4301 y 6379.

Reserva propuesta, toda atada a `127.0.0.1`:

| Servicio | Puerto |
|---|---|
| Angular con renderizado en servidor | `127.0.0.1:4400` |
| API NestJS | `127.0.0.1:3400` |
| PostgreSQL | sin exponer, solo en la red interna del compose |

### Cómo se hace el cambio sin cortar el sitio

No se apaga lo que hay para levantar lo nuevo. La secuencia es:

1. Levantar el compose nuevo en el 4400 y el 3400, sin tocar nginx. El sitio viejo sigue vivo en el 3005.
2. Crear el sitio `apipage.cirsubgn.org.ar` apuntando al 3400, con su certificado. Esto no afecta a nada existente.
3. Crear un sitio temporal, por ejemplo `beta.cirsubgn.org.ar`, apuntando al 4400, para revisar el sitio nuevo en el servidor real antes de mostrarlo.
4. Cuando esté aprobado, activar el sitio `cirsubgn.org.ar` apuntando al 4400, desactivar `cirsubapp` y recargar nginx.
5. Recién ahí apagar el proceso del 3005. Se lo deja instalado una semana por si hay que volver atrás, y después se desinstala.
6. Dar de baja el sitio temporal.

Volver atrás en cualquier punto es reactivar el enlace de `cirsubapp` y recargar. Por eso el archivo viejo se desactiva pero no se borra hasta el final.

### Dos detalles que rompen cosas si se pasan por alto

**Los medios los sirve nginx, no Node.** Se agrega una ubicación `/media/` en el sitio del dominio principal, apuntando directo al volumen de archivos. Como queda bajo el mismo dominio, no hace falta certificado nuevo ni permisos de origen cruzado para las imágenes. Hay que tener presente que en ese archivo ya existe una ubicación `/git`, así que el prefijo elegido no debe pisarla.

**La API tiene que confiar en el intermediario.** NestJS va a ver todas las peticiones viniendo de `127.0.0.1` salvo que se active la confianza en el proxy y se lea la cabecera de dirección real. Si eso no se configura, el límite de intentos de ingreso cuenta a todo el mundo como un solo visitante y termina bloqueando a todos a la vez. En el sitio del API hay que reenviar la dirección real, que es una cabecera que el archivo de la credencial hoy no manda.

### Disco

Está al 87 por ciento, con 2,4 GB libres de 19. No alcanza para sumar PostgreSQL, dos imágenes y una biblioteca de medios que van a alimentar veinte filiales. Lo ampliás antes de la fase 8, tal como quedamos. Cuando llegue el momento, conviene además una limpieza de imágenes y volúmenes de Docker sin uso, que en un equipo con catorce contenedores suele liberar varios gigabytes.

---

## 10. Fases

**Fase 1 · Andamio.** Monorepo, mover la web a `apps/web` sin romper nada, NestJS mínimo, PostgreSQL en Compose, migraciones, entorno de desarrollo funcionando de punta a punta.

**Fase 2 · Identidad.** Invitaciones, canje, ingreso, refresco con rotación, recuperación, roles, permisos con alcance, límite de roles asignables, guardias, auditoría y los correos. Es la fase más delicada y conviene no apurarla.

**Fase 3 · Medios.** Subida, variantes con `sharp`, biblioteca, interfaz de almacenamiento, cuotas por filial.

**Fase 4 · Novedades y circuito editorial.** Entidad completa, TipTap, saneado en el servidor, resumen del carrusel con sus límites, previsualización, estados, revisiones con motivo, historial, avisos por correo y campana de notificaciones.

**Fase 5 · Migración de contenido.** Filiales, autoridades, contactos y las doce páginas informativas pasan de archivos a base, con sus pantallas de administración.

**Fase 6 · Rediseño público.** Tokens del sistema de diseño a variables CSS y a Tailwind, cabecera, pie, componentes, y las pantallas una por una.

**Fase 7 · Movimiento.** Carrusel nuevo, showcase de la credencial guiado por scroll, revelados y conservación de la transición entre rutas y del pulso del mapa.

**Fase 8 · Producción.** Compose de producción, sitios de nginx, certificados, respaldos automáticos de la base y de los medios, registros y un repaso de seguridad.

Las fases 6 y 7 son de presentación y no dependen del backend. Se pueden adelantar en paralelo a la 2 y la 3 si querés ver avance visual antes.

---

## 11. Lo que queda abierto

1. Qué proceso atiende hoy el puerto 3005. No aparece en la lista de contenedores, así que debe ser un servicio del sistema o un gestor de procesos. Necesito saberlo para apagarlo limpio en el paso 5 del cambio.
2. Ampliación del disco antes de la fase 8, ya acordada.
3. Las capturas de la app para cerrar los tramos del showcase.
4. Si el editor de novedades y el administrador de usuarios van a ser la misma persona o dos distintas. Cambia poco técnicamente, pero define los roles que cargamos de arranque.
