-- CreateEnum
CREATE TYPE "CalibrationStatus" AS ENUM ('APPROVED', 'REJECTED');

-- AlterTable
ALTER TABLE "CalibrationRecord" ADD COLUMN     "error" DOUBLE PRECISION,
ADD COLUMN     "status" "CalibrationStatus" NOT NULL DEFAULT 'APPROVED',
ADD COLUMN     "uncertainty" DOUBLE PRECISION;

-- AlterTable
ALTER TABLE "Equipment" ADD COLUMN     "admissibleUncertainty" TEXT,
ADD COLUMN     "location" TEXT,
ADD COLUMN     "maxError" TEXT,
ADD COLUMN     "provider" TEXT,
ADD COLUMN     "unit" TEXT,
ADD COLUMN     "workingRange" TEXT;

-- CreateTable
CREATE TABLE "AcceptanceCriteria" (
    "id" TEXT NOT NULL,
    "equipmentTypeId" TEXT NOT NULL,
    "rangeMin" DOUBLE PRECISION,
    "rangeMax" DOUBLE PRECISION,
    "maxError" DOUBLE PRECISION,
    "maxUncertainty" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AcceptanceCriteria_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AcceptanceCriteria_equipmentTypeId_idx" ON "AcceptanceCriteria"("equipmentTypeId");

-- AddForeignKey
ALTER TABLE "AcceptanceCriteria" ADD CONSTRAINT "AcceptanceCriteria_equipmentTypeId_fkey" FOREIGN KEY ("equipmentTypeId") REFERENCES "EquipmentType"("id") ON DELETE CASCADE ON UPDATE CASCADE;
