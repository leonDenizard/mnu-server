-- Existing hashed links cannot be converted back to their original value.
-- Revoke active legacy links; the next public access/order issues a new link.
ALTER TABLE "CustomerAccessLink" ADD COLUMN "shortId" TEXT;
UPDATE "CustomerAccessLink"
SET "revokedAt" = CURRENT_TIMESTAMP
WHERE "shortId" IS NULL AND "revokedAt" IS NULL;
CREATE UNIQUE INDEX "CustomerAccessLink_shortId_key" ON "CustomerAccessLink"("shortId");

CREATE TABLE "CustomerAddress" (
  "id" TEXT NOT NULL,
  "customerId" TEXT NOT NULL,
  "label" TEXT,
  "street" TEXT NOT NULL,
  "number" INTEGER,
  "neighborhood" TEXT NOT NULL,
  "city" TEXT NOT NULL,
  "state" TEXT NOT NULL,
  "zipCode" TEXT NOT NULL,
  "complement" TEXT,
  "isDefault" BOOLEAN NOT NULL DEFAULT false,
  "active" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "CustomerAddress_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "CustomerAddress_customerId_active_idx" ON "CustomerAddress"("customerId", "active");
ALTER TABLE "CustomerAddress" ADD CONSTRAINT "CustomerAddress_customerId_fkey"
  FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE CASCADE ON UPDATE CASCADE;
