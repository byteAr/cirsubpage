# syntax=docker/dockerfile:1

# ─────────────────────────────── Dependencias ────────────────────────────────
FROM node:22-alpine AS deps
WORKDIR /app

COPY package.json package-lock.json ./
COPY packages/shared/package.json packages/shared/
COPY apps/api/package.json apps/api/
COPY apps/web/package.json apps/web/

# `--ignore-scripts` evita compilar binarios nativos acá: se instalan completos
# en la etapa de build, que sí tiene las herramientas.
RUN npm ci --ignore-scripts

# ──────────────────────────────── Compilación ────────────────────────────────
FROM node:22-alpine AS build
WORKDIR /app

# Herramientas para argon2, que no siempre publica binario para musl y en ese
# caso se compila.
#
# Acá no va `vips-dev` a propósito: sharp trae su propia libvips dentro del
# paquete `@img/sharp-libvips-linuxmusl-x64`, pero si encuentra una libvips
# instalada en el sistema decide compilarse desde el código fuente, y esa
# compilación falla porque node-addon-api pide C++17 y la configuración de
# sharp no lo activa.
RUN apk add --no-cache python3 make g++

COPY --from=deps /app/node_modules ./node_modules
COPY package.json package-lock.json ./
COPY packages ./packages
COPY apps/api ./apps/api

# Sólo argon2: sharp ya viene resuelto por su paquete precompilado y pedirle
# un `rebuild` es lo que dispara la compilación desde el código fuente.
RUN npm rebuild argon2 \
 && npm run build --workspace @cirsub/shared \
 && npx --workspace @cirsub/api prisma generate \
 && npm run build --workspace @cirsub/api

# ──────────────────────────────── Producción ─────────────────────────────────
FROM node:22-alpine AS runtime
WORKDIR /app

ENV NODE_ENV=production
# Sin `vips`: sharp usa la que trae su propio paquete precompilado.
RUN apk add --no-cache tini

COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/packages/shared/dist ./packages/shared/dist
COPY --from=build /app/packages/shared/package.json ./packages/shared/
COPY --from=build /app/apps/api/dist ./apps/api/dist
COPY --from=build /app/apps/api/package.json ./apps/api/
COPY --from=build /app/apps/api/prisma ./apps/api/prisma
COPY package.json ./

# El proceso no corre como root.
RUN addgroup -S cirsub && adduser -S cirsub -G cirsub \
 && mkdir -p /app/storage && chown -R cirsub:cirsub /app/storage
USER cirsub

WORKDIR /app/apps/api
EXPOSE 3400

# tini como PID 1: reenvía las señales y evita procesos zombis.
ENTRYPOINT ["/sbin/tini", "--"]
# `dist/src/` y no `dist/`: el tsconfig incluye archivos fuera de `src`, así que
# TypeScript calcula una raíz común y anida la salida un nivel más.
CMD ["node", "dist/src/main.js"]
