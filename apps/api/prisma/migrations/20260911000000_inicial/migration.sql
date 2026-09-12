-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "EstadoUsuario" AS ENUM ('INVITADO', 'ACTIVO', 'SUSPENDIDO');

-- CreateEnum
CREATE TYPE "Alcance" AS ENUM ('TODOS', 'PROPIO');

-- CreateEnum
CREATE TYPE "EstadoNovedad" AS ENUM ('BORRADOR', 'EN_REVISION', 'CAMBIOS_PEDIDOS', 'PUBLICADA', 'ARCHIVADA', 'CANCELADA');

-- CreateEnum
CREATE TYPE "AccionRevision" AS ENUM ('APROBADA', 'CAMBIOS_PEDIDOS');

-- CreateEnum
CREATE TYPE "TipoPagina" AS ENUM ('SERVICIO', 'TRAMITE', 'INSTITUCIONAL');

-- CreateEnum
CREATE TYPE "TipoBloque" AS ENUM ('PARRAFO', 'TITULO', 'LISTA', 'DESTACADO');

-- CreateTable
CREATE TABLE "roles" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "descripcion" TEXT NOT NULL,
    "nivel" INTEGER NOT NULL,
    "es_sistema" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "roles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rol_asignable" (
    "rol_id" TEXT NOT NULL,
    "asignable_id" TEXT NOT NULL,

    CONSTRAINT "rol_asignable_pkey" PRIMARY KEY ("rol_id","asignable_id")
);

-- CreateTable
CREATE TABLE "permisos" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "modulo" TEXT NOT NULL,
    "accion" TEXT NOT NULL,
    "descripcion" TEXT NOT NULL,

    CONSTRAINT "permisos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rol_permisos" (
    "rol_id" TEXT NOT NULL,
    "permiso_id" TEXT NOT NULL,
    "alcance" "Alcance" NOT NULL DEFAULT 'TODOS',

    CONSTRAINT "rol_permisos_pkey" PRIMARY KEY ("rol_id","permiso_id")
);

-- CreateTable
CREATE TABLE "usuarios" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "password_hash" TEXT,
    "rol_id" TEXT NOT NULL,
    "filial_id" TEXT,
    "estado" "EstadoUsuario" NOT NULL DEFAULT 'INVITADO',
    "totp_secret" TEXT,
    "totp_habilitado" BOOLEAN NOT NULL DEFAULT false,
    "avatar_id" TEXT,
    "ultimo_acceso" TIMESTAMP(3),
    "intentos_fallidos" INTEGER NOT NULL DEFAULT 0,
    "bloqueado_hasta" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "usuarios_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "usuario_permisos" (
    "usuario_id" TEXT NOT NULL,
    "permiso_id" TEXT NOT NULL,
    "alcance" "Alcance" NOT NULL DEFAULT 'TODOS',
    "concedido" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "usuario_permisos_pkey" PRIMARY KEY ("usuario_id","permiso_id")
);

-- CreateTable
CREATE TABLE "invitaciones" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "rol_id" TEXT NOT NULL,
    "filial_id" TEXT,
    "token_hash" TEXT NOT NULL,
    "invitado_por_id" TEXT NOT NULL,
    "expira_en" TIMESTAMP(3) NOT NULL,
    "usado_en" TIMESTAMP(3),
    "revocada_en" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "invitaciones_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "resets_password" (
    "id" TEXT NOT NULL,
    "usuario_id" TEXT NOT NULL,
    "token_hash" TEXT NOT NULL,
    "expira_en" TIMESTAMP(3) NOT NULL,
    "usado_en" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "resets_password_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "refresh_tokens" (
    "id" TEXT NOT NULL,
    "usuario_id" TEXT NOT NULL,
    "token_hash" TEXT NOT NULL,
    "familia_id" TEXT NOT NULL,
    "expira_en" TIMESTAMP(3) NOT NULL,
    "usado_en" TIMESTAMP(3),
    "revocado_en" TIMESTAMP(3),
    "user_agent" TEXT,
    "ip" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "refresh_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "auditoria" (
    "id" TEXT NOT NULL,
    "usuario_id" TEXT,
    "accion" TEXT NOT NULL,
    "entidad" TEXT NOT NULL,
    "entidad_id" TEXT,
    "resumen" TEXT NOT NULL,
    "datos" JSONB,
    "ip" TEXT,
    "nivel" TEXT NOT NULL DEFAULT 'info',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "auditoria_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notificaciones" (
    "id" TEXT NOT NULL,
    "usuario_id" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "titulo" TEXT NOT NULL,
    "cuerpo" TEXT NOT NULL,
    "enlace" TEXT,
    "leida_en" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notificaciones_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "medios" (
    "id" TEXT NOT NULL,
    "storage_key" TEXT NOT NULL,
    "nombre_original" TEXT NOT NULL,
    "mime" TEXT NOT NULL,
    "bytes" INTEGER NOT NULL,
    "ancho" INTEGER,
    "alto" INTEGER,
    "alt" TEXT,
    "subido_por_id" TEXT,
    "filial_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "medios_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "medio_variantes" (
    "id" TEXT NOT NULL,
    "medio_id" TEXT NOT NULL,
    "variante" TEXT NOT NULL,
    "storage_key" TEXT NOT NULL,
    "ancho" INTEGER NOT NULL,
    "alto" INTEGER NOT NULL,
    "formato" TEXT NOT NULL,
    "bytes" INTEGER NOT NULL,

    CONSTRAINT "medio_variantes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "categorias" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "orden" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "categorias_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "novedades" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "estado" "EstadoNovedad" NOT NULL DEFAULT 'BORRADOR',
    "volanta" VARCHAR(24),
    "titulo_slide" VARCHAR(42),
    "bajada_slide" VARCHAR(140),
    "imagen_slide_id" TEXT,
    "en_carrusel" BOOLEAN NOT NULL DEFAULT false,
    "orden_carrusel" INTEGER,
    "carrusel_desde" TIMESTAMP(3),
    "carrusel_hasta" TIMESTAMP(3),
    "titulo" TEXT NOT NULL,
    "bajada" TEXT,
    "cuerpo_html" TEXT NOT NULL DEFAULT '',
    "cuerpo_json" JSONB,
    "portada_id" TEXT,
    "categoria_id" TEXT,
    "autor_id" TEXT NOT NULL,
    "filial_id" TEXT,
    "enviada_en" TIMESTAMP(3),
    "revisor_id" TEXT,
    "revisada_en" TIMESTAMP(3),
    "publicada_en" TIMESTAMP(3),
    "programada_en" TIMESTAMP(3),
    "destacada" BOOLEAN NOT NULL DEFAULT false,
    "vistas" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "novedades_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "novedad_revisiones" (
    "id" TEXT NOT NULL,
    "novedad_id" TEXT NOT NULL,
    "revisor_id" TEXT NOT NULL,
    "accion" "AccionRevision" NOT NULL,
    "motivo" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "novedad_revisiones_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "novedad_versiones" (
    "id" TEXT NOT NULL,
    "novedad_id" TEXT NOT NULL,
    "autor_id" TEXT NOT NULL,
    "snapshot" JSONB NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "novedad_versiones_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "filiales" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "direccion" TEXT,
    "telefono" TEXT,
    "email" TEXT,
    "lat" DOUBLE PRECISION NOT NULL,
    "lng" DOUBLE PRECISION NOT NULL,
    "svg_x" DOUBLE PRECISION,
    "svg_y" DOUBLE PRECISION,
    "foto_id" TEXT,
    "orden" INTEGER NOT NULL DEFAULT 0,
    "activa" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "filiales_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "autoridades" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "rango" TEXT NOT NULL,
    "cargo" TEXT NOT NULL,
    "grupo" TEXT NOT NULL,
    "orden" INTEGER NOT NULL DEFAULT 0,
    "foto_id" TEXT,
    "reporta_a" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "autoridades_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "contactos" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "telefono" TEXT,
    "interno" TEXT,
    "icono" TEXT NOT NULL,
    "orden" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "contactos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "paginas_info" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "tipo" "TipoPagina" NOT NULL,
    "titulo" TEXT NOT NULL,
    "subtitulo" TEXT,
    "icono" TEXT,
    "imagen_id" TEXT,
    "cta_texto" TEXT,
    "cta_enlace" TEXT,
    "cta_externo" BOOLEAN NOT NULL DEFAULT false,
    "descripcion" TEXT,
    "orden" INTEGER NOT NULL DEFAULT 0,
    "activa" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "paginas_info_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "paginas_bloques" (
    "id" TEXT NOT NULL,
    "pagina_id" TEXT NOT NULL,
    "tipo" "TipoBloque" NOT NULL,
    "contenido" TEXT,
    "items" JSONB,
    "orden" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "paginas_bloques_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "configuracion" (
    "clave" TEXT NOT NULL,
    "valor" JSONB NOT NULL,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "configuracion_pkey" PRIMARY KEY ("clave")
);

-- CreateIndex
CREATE UNIQUE INDEX "roles_slug_key" ON "roles"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "permisos_slug_key" ON "permisos"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "usuarios_email_key" ON "usuarios"("email");

-- CreateIndex
CREATE INDEX "usuarios_rol_id_idx" ON "usuarios"("rol_id");

-- CreateIndex
CREATE INDEX "usuarios_filial_id_idx" ON "usuarios"("filial_id");

-- CreateIndex
CREATE UNIQUE INDEX "invitaciones_token_hash_key" ON "invitaciones"("token_hash");

-- CreateIndex
CREATE INDEX "invitaciones_email_idx" ON "invitaciones"("email");

-- CreateIndex
CREATE UNIQUE INDEX "resets_password_token_hash_key" ON "resets_password"("token_hash");

-- CreateIndex
CREATE UNIQUE INDEX "refresh_tokens_token_hash_key" ON "refresh_tokens"("token_hash");

-- CreateIndex
CREATE INDEX "refresh_tokens_usuario_id_idx" ON "refresh_tokens"("usuario_id");

-- CreateIndex
CREATE INDEX "refresh_tokens_familia_id_idx" ON "refresh_tokens"("familia_id");

-- CreateIndex
CREATE INDEX "auditoria_usuario_id_idx" ON "auditoria"("usuario_id");

-- CreateIndex
CREATE INDEX "auditoria_entidad_entidad_id_idx" ON "auditoria"("entidad", "entidad_id");

-- CreateIndex
CREATE INDEX "auditoria_created_at_idx" ON "auditoria"("created_at");

-- CreateIndex
CREATE INDEX "notificaciones_usuario_id_leida_en_idx" ON "notificaciones"("usuario_id", "leida_en");

-- CreateIndex
CREATE UNIQUE INDEX "medios_storage_key_key" ON "medios"("storage_key");

-- CreateIndex
CREATE INDEX "medios_filial_id_idx" ON "medios"("filial_id");

-- CreateIndex
CREATE INDEX "medios_created_at_idx" ON "medios"("created_at");

-- CreateIndex
CREATE UNIQUE INDEX "medio_variantes_medio_id_variante_formato_key" ON "medio_variantes"("medio_id", "variante", "formato");

-- CreateIndex
CREATE UNIQUE INDEX "categorias_slug_key" ON "categorias"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "novedades_slug_key" ON "novedades"("slug");

-- CreateIndex
CREATE INDEX "novedades_estado_publicada_en_idx" ON "novedades"("estado", "publicada_en");

-- CreateIndex
CREATE INDEX "novedades_en_carrusel_orden_carrusel_idx" ON "novedades"("en_carrusel", "orden_carrusel");

-- CreateIndex
CREATE INDEX "novedades_filial_id_idx" ON "novedades"("filial_id");

-- CreateIndex
CREATE INDEX "novedades_autor_id_idx" ON "novedades"("autor_id");

-- CreateIndex
CREATE INDEX "novedad_revisiones_novedad_id_idx" ON "novedad_revisiones"("novedad_id");

-- CreateIndex
CREATE INDEX "novedad_versiones_novedad_id_idx" ON "novedad_versiones"("novedad_id");

-- CreateIndex
CREATE UNIQUE INDEX "paginas_info_slug_key" ON "paginas_info"("slug");

-- CreateIndex
CREATE INDEX "paginas_info_tipo_orden_idx" ON "paginas_info"("tipo", "orden");

-- CreateIndex
CREATE INDEX "paginas_bloques_pagina_id_orden_idx" ON "paginas_bloques"("pagina_id", "orden");

-- AddForeignKey
ALTER TABLE "rol_asignable" ADD CONSTRAINT "rol_asignable_rol_id_fkey" FOREIGN KEY ("rol_id") REFERENCES "roles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rol_asignable" ADD CONSTRAINT "rol_asignable_asignable_id_fkey" FOREIGN KEY ("asignable_id") REFERENCES "roles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rol_permisos" ADD CONSTRAINT "rol_permisos_rol_id_fkey" FOREIGN KEY ("rol_id") REFERENCES "roles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rol_permisos" ADD CONSTRAINT "rol_permisos_permiso_id_fkey" FOREIGN KEY ("permiso_id") REFERENCES "permisos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "usuarios" ADD CONSTRAINT "usuarios_rol_id_fkey" FOREIGN KEY ("rol_id") REFERENCES "roles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "usuarios" ADD CONSTRAINT "usuarios_filial_id_fkey" FOREIGN KEY ("filial_id") REFERENCES "filiales"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "usuarios" ADD CONSTRAINT "usuarios_avatar_id_fkey" FOREIGN KEY ("avatar_id") REFERENCES "medios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "usuario_permisos" ADD CONSTRAINT "usuario_permisos_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "usuario_permisos" ADD CONSTRAINT "usuario_permisos_permiso_id_fkey" FOREIGN KEY ("permiso_id") REFERENCES "permisos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invitaciones" ADD CONSTRAINT "invitaciones_rol_id_fkey" FOREIGN KEY ("rol_id") REFERENCES "roles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invitaciones" ADD CONSTRAINT "invitaciones_filial_id_fkey" FOREIGN KEY ("filial_id") REFERENCES "filiales"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invitaciones" ADD CONSTRAINT "invitaciones_invitado_por_id_fkey" FOREIGN KEY ("invitado_por_id") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "resets_password" ADD CONSTRAINT "resets_password_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "refresh_tokens" ADD CONSTRAINT "refresh_tokens_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "auditoria" ADD CONSTRAINT "auditoria_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notificaciones" ADD CONSTRAINT "notificaciones_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "medios" ADD CONSTRAINT "medios_subido_por_id_fkey" FOREIGN KEY ("subido_por_id") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "medios" ADD CONSTRAINT "medios_filial_id_fkey" FOREIGN KEY ("filial_id") REFERENCES "filiales"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "medio_variantes" ADD CONSTRAINT "medio_variantes_medio_id_fkey" FOREIGN KEY ("medio_id") REFERENCES "medios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "novedades" ADD CONSTRAINT "novedades_imagen_slide_id_fkey" FOREIGN KEY ("imagen_slide_id") REFERENCES "medios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "novedades" ADD CONSTRAINT "novedades_portada_id_fkey" FOREIGN KEY ("portada_id") REFERENCES "medios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "novedades" ADD CONSTRAINT "novedades_categoria_id_fkey" FOREIGN KEY ("categoria_id") REFERENCES "categorias"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "novedades" ADD CONSTRAINT "novedades_autor_id_fkey" FOREIGN KEY ("autor_id") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "novedades" ADD CONSTRAINT "novedades_revisor_id_fkey" FOREIGN KEY ("revisor_id") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "novedades" ADD CONSTRAINT "novedades_filial_id_fkey" FOREIGN KEY ("filial_id") REFERENCES "filiales"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "novedad_revisiones" ADD CONSTRAINT "novedad_revisiones_novedad_id_fkey" FOREIGN KEY ("novedad_id") REFERENCES "novedades"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "novedad_revisiones" ADD CONSTRAINT "novedad_revisiones_revisor_id_fkey" FOREIGN KEY ("revisor_id") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "novedad_versiones" ADD CONSTRAINT "novedad_versiones_novedad_id_fkey" FOREIGN KEY ("novedad_id") REFERENCES "novedades"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "novedad_versiones" ADD CONSTRAINT "novedad_versiones_autor_id_fkey" FOREIGN KEY ("autor_id") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "filiales" ADD CONSTRAINT "filiales_foto_id_fkey" FOREIGN KEY ("foto_id") REFERENCES "medios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "autoridades" ADD CONSTRAINT "autoridades_foto_id_fkey" FOREIGN KEY ("foto_id") REFERENCES "medios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "paginas_info" ADD CONSTRAINT "paginas_info_imagen_id_fkey" FOREIGN KEY ("imagen_id") REFERENCES "medios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "paginas_bloques" ADD CONSTRAINT "paginas_bloques_pagina_id_fkey" FOREIGN KEY ("pagina_id") REFERENCES "paginas_info"("id") ON DELETE CASCADE ON UPDATE CASCADE;
┌─────────────────────────────────────────────────────────┐
│  Update available 6.19.3 -> 8.0.0-rc.13                 │
│                                                         │
│  This is a major update - please follow the guide at    │
│  https://pris.ly/d/major-version-upgrade                │
│                                                         │
│  Run the following to update                            │
│    npm i --save-dev prisma@latest                       │
│    npm i @prisma/client@latest                          │
└─────────────────────────────────────────────────────────┘

