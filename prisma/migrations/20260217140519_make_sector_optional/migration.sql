-- DropForeignKey
ALTER TABLE "Equipment" DROP CONSTRAINT "Equipment_sectorId_fkey";

-- AlterTable
ALTER TABLE "Equipment" ALTER COLUMN "sectorId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "Equipment" ADD CONSTRAINT "Equipment_sectorId_fkey" FOREIGN KEY ("sectorId") REFERENCES "Sector"("id") ON DELETE SET NULL ON UPDATE CASCADE;
