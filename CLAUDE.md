# Cómo se trabaja en este proyecto

Este archivo viaja con el repositorio. Si algo de acá queda viejo, corregirlo es
parte del trabajo.

## El proyecto vive en la Mac mini

Hay **una sola copia del código**, y está en la Mac mini de la casa, en
`~/Developer/cirsubpage`. Desde donde sea —la notebook Windows, la PC del
trabajo— no se clona el repositorio: se entra a la Mac y se trabaja ahí.

Esto reemplaza al esquema anterior, de dos máquinas alternándose, que ya hizo
perder trabajo una vez. Con una sola copia no hay dos ramas que divergen ni
cambios que quedaron en el otro equipo.

### Entrar

```bash
ssh -t macmini 'tmux new -A -s dev'
```

La Mac se alcanza por Tailscale, que le da una dirección fija que no cambia
nunca, esté en la red que esté. No hay puertos abiertos en el router: las dos
puntas salen hacia afuera y se encuentran en el medio.

`tmux new -A -s dev` se engancha a la sesión `dev` o la crea si no existe. **Es
importante entrar siempre así.** Lo que corre adentro de `tmux` vive en la Mac,
no en la conexión: se corta el wifi, se cierra la notebook, se termina la
jornada, y al volver con el mismo comando está todo como se dejó. Entrando por
SSH pelado, cada corte mata lo que estuviera corriendo.

Para desengancharse sin matar nada: `Ctrl+b` y después `d`.

### La Mac vuelve sola de un reinicio

Está configurada para eso, porque quien la necesita suele estar lejos:

- `pmset autorestart 1` — se prende sola si se corta la luz
- `pmset sleep 0 disksleep 0 womp 1` — no se duerme y despierta por red
- inicio de sesión automático
- Tailscale como elemento de inicio

Probado con un reinicio real: respondía 28 segundos después de arrancar.

**FileVault está apagado a propósito.** Con FileVault encendido, después de un
reinicio el disco queda cerrado y no arranca nada —ni Tailscale ni SSH— hasta
que alguien escriba la contraseña ahí, con teclado. Estando Marcos en el
trabajo, eso es quedarse sin acceso hasta volver a la casa. Se eligió sabiendo
el riesgo: si se roban el equipo, se llevan las claves. Se va a volver a prender
cuando haya una UPS, porque entonces los reinicios no planificados casi
desaparecen. **No lo prendas sin avisar.**

Para un reinicio planificado con FileVault encendido, el comando correcto es
`sudo fdesetup authrestart`, que lo deja volver desbloqueado.

## Git

Con una sola copia, `git push` dejó de ser sincronización y pasó a ser
**respaldo**. Una sola máquina es también un solo punto de falla: si la Mac se
muere, se muere todo lo que no esté en GitHub.

### Al empezar

```bash
git fetch origin --prune
git status
```

El `fetch --prune` primero no es decorativo: sin él se trabaja con una lista de
ramas vieja. Ya pasó una vez —se concluyó que no existía una rama que sí estaba
en GitHub, y sobre esa conclusión se movió `main`—, así que antes de mirar ramas
o decidir cualquier cosa sobre ellas, **fetch primero**.

### Antes de levantarse

```bash
git status
git add -A && git commit -m "qué se hizo"
git push
```

Aunque el trabajo esté a medias. Un commit a medias en una rama propia se arregla
después.

## Ramas

- `main` — el proyecto de verdad. **Staging despliega de acá.** Producción
  también, cuando exista.
- `feat/<lo-que-sea>` — una por tanda de trabajo. Se integra a `main` cuando
  Marcos la revisa y la aprueba.
- `maps3d` — vieja, de 2025. No se usa.

Producción todavía no existe: `testpage.cirsubgn.org.ar` es staging.

**Nada va a producción sin que Marcos lo revise antes en staging.**

## Qué espera Marcos del asistente

- **Verificar antes de afirmar.** Correr el comando, leer la salida, y recién ahí
  decir que algo funciona. Si no se pudo comprobar, decirlo.
- **Decir cuando algo no se sabe o no se pudo hacer**, en vez de rodearlo.
- **Los comentarios del código y los mensajes de commit van en castellano**, y
  explican por qué, no qué. El estilo del repositorio ya está; conviene mirarlo
  antes de escribir.
- **Avisar los efectos no obvios** de un cambio: lo que se rompe en otro lado, lo
  que hay que correr en el servidor, lo que cambia para quien usa el panel.

## Antes de dar por terminado un cambio

```bash
npm run build -w apps/web                   # compila el sitio
npx tsc -p apps/api/tsconfig.json --noEmit  # tipos de la API
```

Si el cambio toca la base, además hay que generar la migración y recordar que en
el servidor se corre aparte: reconstruir la imagen no aplica migraciones ni
recarga la semilla.

## Cosas que ya mordieron

- **La semilla pisa datos.** `npm run db:seed` actualiza filiales y autoridades.
  Si alguien borró algo en el panel y sigue en la semilla, vuelve a aparecer.
  Las páginas de servicios y Alojamiento son la excepción: se editan en el panel,
  así que la semilla solo crea las que faltan y no toca las que existen. Un
  cambio de texto en `info-pages.ts` ya no llega a una base que tenga la página.
- **El renderizado en servidor se apaga sin avisar.** Si el HTML de la portada
  pesa ~12 kB en vez de ~100 kB, Angular está entregando la página vacía. Las dos
  causas conocidas están explicadas en `apps/web/src/server.ts` y en
  `docker/nginx-sitio.conf`.
- **Cloudflare cachea.** Al revisar un cambio en staging, mirarlo en incógnito o
  purgar la caché; si no, se ve la versión vieja durante horas.
- **El `.env` del servidor no está en git.** Las variables nuevas hay que
  agregarlas a mano allá, además de documentarlas en `.env.despliegue.example`.
- **`zsh` se come las palabras que empiezan con `=`.** Un `echo ===algo===` en la
  shell de la Mac falla y, si está encadenado con `;`, se lleva puesto el comando
  que sigue. Usar otro separador.
