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

# sharp y argon2 traen binarios precompilados, pero si el registro no tiene el
# de esta arquitectura hacen falta las herramientas de compilación.
RUN apk add --no-cache python3 make g++ vips-dev

COPY --from=deps /app/node_modules ./node_modules
COPY package.json package-lock.json ./
COPY packages ./packages
COPY apps/api ./apps/api

RUN npm rebuild sharp argon2 \
 && npm run build --workspace @cirsub/shared \
 && npx --workspace @cirsub/api prisma generate \
 && npm run build --workspace @cirsub/api

# ──────────────────────────────── Producción ─────────────────────────────────
FROM node:22-alpine AS runtime
WORKDIR /app

ENV NODE_ENV=production
RUN apk add --no-cache vips tini

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
CMD ["node", "dist/main.js"]
