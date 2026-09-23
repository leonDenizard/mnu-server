CREATE TYPE "StoreAvailabilityMode" AS ENUM ('ALWAYS_AVAILABLE', 'SCHEDULED', 'SCHEDULED_ONLY', 'PERMANENTLY_CLOSED');

ALTER TABLE "Store" ADD COLUMN "availabilityMode" "StoreAvailabilityMode" NOT NULL DEFAULT 'ALWAYS_AVAILABLE';
UPDATE "Store" SET "availabilityMode" = 'PERMANENTLY_CLOSED' WHERE "isOpen" = false;

CREATE TABLE "StoreUnavailabilityPeriod" (
  "id" TEXT NOT NULL,
  "storeId" TEXT NOT NULL,
  "startsAt" TIMESTAMP(3) NOT NULL,
  "endsAt" TIMESTAMP(3) NOT NULL,
  "reason" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "StoreUnavailabilityPeriod_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "StoreUnavailabilityPeriod_storeId_startsAt_endsAt_idx" ON "StoreUnavailabilityPeriod"("storeId", "startsAt", "endsAt");
ALTER TABLE "StoreUnavailabilityPeriod" ADD CONSTRAINT "StoreUnavailabilityPeriod_storeId_fkey"
  FOREIGN KEY ("storeId") REFERENCES "Store"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "StoreAvailabilityEventOutbox" (
  "id" BIGSERIAL NOT NULL,
  "storeId" TEXT NOT NULL,
  "type" TEXT NOT NULL,
  "payload" JSONB NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "StoreAvailabilityEventOutbox_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "StoreAvailabilityEventOutbox_storeId_id_idx" ON "StoreAvailabilityEventOutbox"("storeId", "id");
ALTER TABLE "StoreAvailabilityEventOutbox" ADD CONSTRAINT "StoreAvailabilityEventOutbox_storeId_fkey"
  FOREIGN KEY ("storeId") REFERENCES "Store"("id") ON DELETE CASCADE ON UPDATE CASCADE;
