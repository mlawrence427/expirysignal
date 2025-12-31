-- AlterTable
ALTER TABLE "ExpiryRecord"
ADD COLUMN     "causeCode" TEXT,
ADD COLUMN     "renewable" BOOLEAN;
