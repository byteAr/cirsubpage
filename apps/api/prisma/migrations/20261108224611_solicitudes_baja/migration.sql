-- CreateEnum
CREATE TYPE "EstadoBaja" AS ENUM ('PENDIENTE', 'EN_CURSO', 'RESUELTA', 'RECHAZADA');

-- CreateTable
CREATE TABLE "solicitudes_baja" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "dni" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "alcance" TEXT NOT NULL,
    "detalle" TEXT,
    "estado" "EstadoBaja" NOT NULL DEFAULT 'PENDIENTE',
    "respuesta" TEXT,
    "resuelta_por_id" TEXT,
    "resuelta_en" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "solicitudes_baja_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "solicitudes_baja_estado_idx" ON "solicitudes_baja"("estado");

-- AddForeignKey
ALTER TABLE "solicitudes_baja" ADD CONSTRAINT "solicitudes_baja_resuelta_por_id_fkey" FOREIGN KEY ("resuelta_por_id") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;
