-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "PartyType" AS ENUM ('CUSTOMER', 'SUPPLIER');

-- CreateEnum
CREATE TYPE "EntryType" AS ENUM ('DEBIT', 'CREDIT');

-- CreateEnum
CREATE TYPE "DocumentType" AS ENUM ('IMAGE', 'PDF');

-- CreateTable
CREATE TABLE "Workbook" (
    "id" UUID NOT NULL,
    "ownerId" VARCHAR(128) NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "currency" CHAR(3) NOT NULL DEFAULT 'INR',
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "Workbook_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Party" (
    "id" UUID NOT NULL,
    "workbookId" UUID NOT NULL,
    "name" VARCHAR(160) NOT NULL,
    "type" "PartyType" NOT NULL,
    "openingBalance" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "Party_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Transaction" (
    "id" UUID NOT NULL,
    "partyId" UUID NOT NULL,
    "date" DATE NOT NULL,
    "description" VARCHAR(500) NOT NULL,
    "amount" DECIMAL(14,2) NOT NULL,
    "entryType" "EntryType" NOT NULL,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "Transaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TransactionDocument" (
    "id" UUID NOT NULL,
    "transactionId" UUID NOT NULL,
    "objectKey" VARCHAR(1024) NOT NULL,
    "bucket" VARCHAR(63) NOT NULL DEFAULT 'assets',
    "fileName" VARCHAR(255) NOT NULL,
    "mimeType" VARCHAR(100) NOT NULL,
    "fileSize" INTEGER NOT NULL,
    "type" "DocumentType" NOT NULL,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TransactionDocument_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Workbook_ownerId_updatedAt_idx" ON "Workbook"("ownerId", "updatedAt");

-- CreateIndex
CREATE UNIQUE INDEX "Workbook_ownerId_name_key" ON "Workbook"("ownerId", "name");

-- CreateIndex
CREATE INDEX "Party_workbookId_name_idx" ON "Party"("workbookId", "name");

-- CreateIndex
CREATE INDEX "Transaction_partyId_date_createdAt_idx" ON "Transaction"("partyId", "date", "createdAt");

-- CreateIndex
CREATE INDEX "Transaction_date_idx" ON "Transaction"("date");

-- CreateIndex
CREATE UNIQUE INDEX "TransactionDocument_objectKey_key" ON "TransactionDocument"("objectKey");

-- CreateIndex
CREATE INDEX "TransactionDocument_transactionId_createdAt_idx" ON "TransactionDocument"("transactionId", "createdAt");

-- AddForeignKey
ALTER TABLE "Party" ADD CONSTRAINT "Party_workbookId_fkey" FOREIGN KEY ("workbookId") REFERENCES "Workbook"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_partyId_fkey" FOREIGN KEY ("partyId") REFERENCES "Party"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TransactionDocument" ADD CONSTRAINT "TransactionDocument_transactionId_fkey" FOREIGN KEY ("transactionId") REFERENCES "Transaction"("id") ON DELETE CASCADE ON UPDATE CASCADE;
