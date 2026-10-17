-- CreateEnum
CREATE TYPE "BillitSyncSource" AS ENUM ('ORDER', 'POS_SALE');

-- CreateEnum
CREATE TYPE "BillitSyncStatus" AS ENUM ('PENDING', 'SENT', 'FAILED');

-- CreateTable
CREATE TABLE "BillitConnection" (
    "id" TEXT NOT NULL DEFAULT 'default',
    "environment" TEXT NOT NULL DEFAULT 'sandbox',
    "partyId" TEXT NOT NULL,
    "accessTokenEncrypted" TEXT NOT NULL,
    "refreshTokenEncrypted" TEXT NOT NULL,
    "accessTokenExpiresAt" TIMESTAMP(3) NOT NULL,
    "connectedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "lastError" TEXT,

    CONSTRAINT "BillitConnection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BillitInvoiceSync" (
    "id" TEXT NOT NULL,
    "sourceType" "BillitSyncSource" NOT NULL,
    "sourceId" TEXT NOT NULL,
    "sourceNumber" TEXT NOT NULL,
    "status" "BillitSyncStatus" NOT NULL DEFAULT 'PENDING',
    "billitOrderId" INTEGER,
    "billitOrderNumber" TEXT,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "lastError" TEXT,
    "lastAttemptAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BillitInvoiceSync_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "BillitInvoiceSync_status_updatedAt_idx" ON "BillitInvoiceSync"("status", "updatedAt");

-- CreateIndex
CREATE UNIQUE INDEX "BillitInvoiceSync_sourceType_sourceId_key" ON "BillitInvoiceSync"("sourceType", "sourceId");
