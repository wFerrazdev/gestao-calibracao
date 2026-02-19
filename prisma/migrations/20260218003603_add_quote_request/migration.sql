-- CreateEnum
CREATE TYPE "QuoteRequestStatus" AS ENUM ('OPEN', 'SENT', 'CLOSED');

-- AlterTable
ALTER TABLE "ServiceOrder" ADD COLUMN     "quoteRequestId" TEXT;

-- CreateTable
CREATE TABLE "QuoteRequest" (
    "id" TEXT NOT NULL,
    "supplierId" TEXT NOT NULL,
    "status" "QuoteRequestStatus" NOT NULL DEFAULT 'OPEN',
    "emailSubject" TEXT,
    "emailBody" TEXT,
    "emailCc" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "QuoteRequest_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "QuoteRequest_supplierId_idx" ON "QuoteRequest"("supplierId");

-- CreateIndex
CREATE INDEX "QuoteRequest_status_idx" ON "QuoteRequest"("status");

-- CreateIndex
CREATE INDEX "ServiceOrder_quoteRequestId_idx" ON "ServiceOrder"("quoteRequestId");

-- AddForeignKey
ALTER TABLE "ServiceOrder" ADD CONSTRAINT "ServiceOrder_quoteRequestId_fkey" FOREIGN KEY ("quoteRequestId") REFERENCES "QuoteRequest"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuoteRequest" ADD CONSTRAINT "QuoteRequest_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "Supplier"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
