# syntax=docker/dockerfile:1
#
# El sitio corre con renderizado en servidor, así que la imagen final es un
# proceso Node, no un nginx sirviendo archivos. El nginx del sistema operativo
# hace de intermediario por delante.

# ─────────────────────────────── Dependencias ────────────────────────────────
FROM node:22-alpine AS deps
WORKDIR /app

COPY package.json package-lock.json ./
COPY packages/shared/package.json packages/shared/
COPY apps/api/package.json apps/api/
COPY apps/web/package.json apps/web/

RUN npm ci --ignore-scripts

# ──────────────────────────────── Compilación ────────────────────────────────
FROM node:22-alpine AS build
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY package.json package-lock.json ./
COPY packages ./packages
COPY apps/web ./apps/web

RUN npm run build --workspace @cirsub/shared \
 && npm run build --workspace @cirsub/web

# ──────────────────────────────── Producción ─────────────────────────────────
FROM node:22-alpine AS runtime
WORKDIR /app

ENV NODE_ENV=production
RUN apk add --no-cache tini

COPY --from=build /app/apps/web/dist/cirsub-web ./dist/cirsub-web

RUN addgroup -S cirsub && adduser -S cirsub -G cirsub
USER cirsub

EXPOSE 4400
ENV PORT=4400

ENTRYPOINT ["/sbin/tini", "--"]
CMD ["node", "dist/cirsub-web/server/server.mjs"]
