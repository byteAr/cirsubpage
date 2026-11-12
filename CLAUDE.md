# Cómo se trabaja en este proyecto

Este archivo viaja con el repositorio, así que vale igual desde la notebook
Windows, desde la Mac mini o desde donde sea. Si algo de acá queda viejo,
corregirlo es parte del trabajo.

## Se trabaja desde dos máquinas

El proyecto se toca desde una notebook con Windows y desde una Mac mini. Nunca
las dos a la vez, pero sí alternando el mismo día. **Todo lo que sincroniza las
dos máquinas es GitHub**: lo que no esté subido, en la otra máquina no existe.

### Al empezar a trabajar, siempre

```bash
git fetch origin --prune
git status
git pull
```

El `fetch --prune` primero no es decorativo: sin él se trabaja con una lista de
ramas vieja. Ya pasó una vez —se concluyó que no existía una rama que sí estaba
en GitHub, y sobre esa conclusión se movió `main`—, así que antes de mirar ramas
o decidir cualquier cosa sobre ellas, **fetch primero**.

### Antes de levantarse, siempre

```bash
git status                                  # ¿quedó algo sin guardar?
git add -A && git commit -m "qué se hizo"
git push
```

Aunque el trabajo esté a medias. Un commit a medias en una rama propia se arregla
después; lo que no se puede arreglar es abrir la otra máquina y que el trabajo no
esté.

### Si la sesión se corta de golpe

Puede quedar trabajo sin subir. Al retomar, en **las dos** máquinas:

```bash
git fetch origin --prune
git log --oneline origin/<la rama>..HEAD    # commits que no se subieron
git status                                   # archivos sin guardar
```

## Ramas

- `main` — el proyecto aprobado. Se mueve **solo** cuando Marcos (y su
  supervisor) aprueban lo que está en staging. Producción va a desplegar de acá.
- `feat/panel-permisos-filiales` — la tanda en curso. **Staging despliega de
  esta rama hasta que se integre a `main`.** Para saber qué rama corre en
  staging, mirarlo en el servidor, no suponerlo:
  `cat /usr/local/proyectos/cirsubpage-stg/.git/HEAD`.
- `feat/<lo-que-sea>` — una por tanda de trabajo, que sale de la rama en curso
  (no de una vieja). Se integra cuando Marcos la revisa y la aprueba.
- `maps3d` — vieja, de 2025. No se usa.

Antes de empezar algo nuevo, comprobar de qué rama se parte con
`git log --oneline -3 origin/<rama>`: ya pasó que se trabajó sobre una copia de
septiembre y quedaron dos versiones del proyecto que no compilaban juntas.

Producción todavía no existe: `testpage.cirsubgn.org.ar` es staging. El sitio
viejo sigue en `cirsubgn.org.ar` (PM2, puerto 3005). Vercel ya no se usa.

**Nada va a producción sin que Marcos lo revise antes en staging.**

## Desplegar en staging

El servidor está detrás de la VPN (OpenVPN) y se entra con `ssh cirsub`. El
`.env` de staging es de root con permisos `600`, así que desplegar necesita la
contraseña de root:

```bash
ssh -t cirsub "su -c 'sh /home/marcos/desplegar-stg.sh'"
```

El script trae la rama, reconstruye API y web, levanta los contenedores y aplica
las migraciones; se detiene si hay cambios sin commitear en el servidor. Antes de
algo grande, respaldar la base (`pg_dump`, a `~/respaldos/`). `docker compose
build` a veces no termina aunque ya construyó: el script lo contempla.

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

- **La semilla pisa datos.** `npm run db:seed` actualiza autoridades y páginas
  informativas, y vuelve a escribir la contraseña del superadministrador con la
  del `.env`. Las filiales que ya existen no las toca. Si alguien borró algo en el
  panel y sigue en la semilla, vuelve a aparecer.
- **El renderizado en servidor se apaga sin avisar.** Si el HTML de la portada
  pesa ~12 kB en vez de ~100 kB, Angular está entregando la página vacía. Las dos
  causas conocidas están explicadas en `apps/web/src/server.ts` y en
  `docker/nginx-sitio.conf`.
- **Cloudflare cachea.** Al revisar un cambio en staging, mirarlo en incógnito o
  purgar la caché; si no, se ve la versión vieja durante horas.
- **El `.env` del servidor no está en git.** Las variables nuevas hay que
  agregarlas a mano allá, además de documentarlas en `.env.despliegue.example`.
