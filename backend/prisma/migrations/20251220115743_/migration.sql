-- CreateTable
CREATE TABLE "ExpiryRecord" (
    "id" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "scope" TEXT,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ExpiryRecord_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ExpiryRecord_subject_scope_idx" ON "ExpiryRecord"("subject", "scope");

-- CreateIndex
CREATE UNIQUE INDEX "ExpiryRecord_subject_scope_key" ON "ExpiryRecord"("subject", "scope");
