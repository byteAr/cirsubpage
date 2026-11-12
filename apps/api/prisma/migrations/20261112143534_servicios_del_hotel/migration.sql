-- AlterTable
ALTER TABLE "filiales" ADD COLUMN     "servicios_hotel" TEXT[] DEFAULT ARRAY[]::TEXT[];
