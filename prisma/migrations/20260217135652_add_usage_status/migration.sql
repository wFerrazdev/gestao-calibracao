-- CreateEnum
CREATE TYPE "UsageStatus" AS ENUM ('IN_USE', 'IN_STOCK');

-- AlterTable
ALTER TABLE "Equipment" ADD COLUMN     "usageStatus" "UsageStatus" NOT NULL DEFAULT 'IN_USE';
