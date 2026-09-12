# CIRSUB

Sitio institucional y panel de administración de la Mutual del Círculo de Suboficiales de Gendarmería Nacional Argentina.

## Qué hay acá

```
apps/web        Angular 20 con renderizado en servidor. Sitio público y panel en /admin
apps/api        NestJS 11 + Prisma + PostgreSQL
packages/shared Permisos, roles, estados y tipos que usan las dos aplicaciones
docker/         Dockerfiles y los sitios de nginx para el servidor
```

## Arrancar en desarrollo

Hace falta Node 22 y Docker.

```bash
cp .env.example .env
# Editar .env: al menos JWT_SECRET y SUPERADMIN_PASSWORD

npm install
npm run build:shared

docker compose up -d           # PostgreSQL en 127.0.0.1:5433
npm run db:migrate             # crea las tablas
npm run db:seed                # permisos, roles, filiales, autoridades, contactos y páginas

npm run dev:api                # API en http://localhost:3400/api
npm run dev:web                # sitio en http://localhost:4200
```

La documentación de la API queda en `http://localhost:3400/api/docs` mientras `NODE_ENV` no sea `production`.

## Cómo está armado

**Permisos.** El catálogo vive en `packages/shared/src/permisos.ts` y es la única fuente de verdad. La API protege las rutas con `@RequierePermiso()` y el sitio decide qué muestra con la directiva `*siPuede`. El frontend oculta por comodidad; quien decide es siempre el backend.

**Alcance.** Un permiso puede ser `todos` o `propio`. El alcance propio es lo que permite que un referente de filial edite lo suyo y no lo de las otras diecinueve.

**Roles asignables.** Cada rol declara qué roles puede asignar al invitar. Sin eso, un administrador de usuarios podría fabricarse un superadministrador.

**Circuito editorial.** Una novedad recorre borrador, en revisión, cambios pedidos, publicada, archivada o cancelada. Las transiciones válidas están en `packages/shared/src/novedades.ts` y las valida la API, no la pantalla.

**Contenido enriquecido.** El editor es TipTap. Guarda la estructura en JSON, que es la fuente de verdad para volver a editar, y el HTML ya saneado, que es lo que el sitio publica. El saneado corre en el servidor con lista blanca estricta.

**Medios.** Al subir una imagen se generan variantes en WebP y AVIF con `sharp`, incluido el recorte 4:3 del carrusel. En la base solo se guarda la clave relativa, nunca una dirección completa: eso es lo que después permite mudar los archivos a un NAS sin tocar datos.

## Despliegue

Ver `PLAN-TECNICO.md`, sección 9. El resumen:

1. El nginx del sistema se queda con los puertos 80 y 443. El compose publica en `127.0.0.1:4400` y `127.0.0.1:3400`.
2. Copiar los dos archivos de `docker/nginx/` a `/etc/nginx/sites-available/` y enlazarlos.
3. `docker compose -f compose.prod.yaml up -d --build`
4. `docker compose -f compose.prod.yaml exec api npx prisma migrate deploy`
5. Recién ahí apagar el proceso viejo del puerto 3005 y desactivar el sitio `cirsubapp`.

## Comandos

| Comando | Qué hace |
|---|---|
| `npm run build` | Compila shared, API y sitio |
| `npm run db:migrate` | Aplica migraciones en desarrollo |
| `npm run db:seed` | Carga permisos, roles y contenido institucional |
| `npm run db:studio` | Abre Prisma Studio |
| `npm run docker:up` | Levanta PostgreSQL |
