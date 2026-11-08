-- CreateEnum
CREATE TYPE "EstadoCambio" AS ENUM ('PENDIENTE', 'APROBADO', 'RECHAZADO', 'REEMPLAZADO');

-- AlterTable
ALTER TABLE "filiales"
ADD COLUMN     "contactos" JSONB NOT NULL DEFAULT '[]',
ADD COLUMN     "convenios" JSONB NOT NULL DEFAULT '[]',
ADD COLUMN     "habitaciones" INTEGER,
ADD COLUMN     "place_id" TEXT;

-- Los datos de contacto pasan a la lista nueva, salvo los de relleno que venían
-- del sitio viejo (teléfonos «400-000X» y correos de @empresa.com): esos nunca
-- fueron de la filial y no hay que publicarlos como si lo fueran.
UPDATE "filiales" SET "contactos" = (
  SELECT COALESCE(jsonb_agg(c), '[]'::jsonb) FROM (
    SELECT jsonb_build_object('tipo', 'telefono', 'valor', "telefono", 'etiqueta', NULL) AS c
    WHERE "telefono" IS NOT NULL AND "telefono" <> '' AND "telefono" !~ '40{2,3}-0{3}[0-9]$'
    UNION ALL
    SELECT jsonb_build_object('tipo', 'email', 'valor', "email", 'etiqueta', NULL)
    WHERE "email" IS NOT NULL AND "email" <> '' AND "email" !~* '@empresa\.com$'
  ) AS filas
);

ALTER TABLE "filiales" DROP COLUMN "email",
DROP COLUMN "telefono";

-- AlterTable
ALTER TABLE "invitaciones" ADD COLUMN     "funciones" TEXT[] DEFAULT ARRAY[]::TEXT[];

-- AlterTable
ALTER TABLE "usuarios" ADD COLUMN     "eliminado_en" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "cambios_pendientes" (
    "id" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "filial_id" TEXT,
    "datos" JSONB NOT NULL,
    "anterior" JSONB NOT NULL,
    "estado" "EstadoCambio" NOT NULL DEFAULT 'PENDIENTE',
    "motivo" TEXT,
    "autor_id" TEXT NOT NULL,
    "revisor_id" TEXT,
    "revisado_en" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "cambios_pendientes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "cambios_pendientes_estado_tipo_idx" ON "cambios_pendientes"("estado", "tipo");

-- CreateIndex
CREATE INDEX "cambios_pendientes_autor_id_idx" ON "cambios_pendientes"("autor_id");

-- CreateIndex
CREATE INDEX "cambios_pendientes_filial_id_idx" ON "cambios_pendientes"("filial_id");

-- AddForeignKey
ALTER TABLE "cambios_pendientes" ADD CONSTRAINT "cambios_pendientes_filial_id_fkey" FOREIGN KEY ("filial_id") REFERENCES "filiales"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cambios_pendientes" ADD CONSTRAINT "cambios_pendientes_autor_id_fkey" FOREIGN KEY ("autor_id") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cambios_pendientes" ADD CONSTRAINT "cambios_pendientes_revisor_id_fkey" FOREIGN KEY ("revisor_id") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;
