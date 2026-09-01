-- Store-level order behavior
ALTER TABLE "Store"
ADD COLUMN "autoAcceptOrders" BOOLEAN NOT NULL DEFAULT false;

-- Replace the order status enum after mapping the legacy ACCEPTED state.
ALTER TABLE "Order" ALTER COLUMN "status" DROP DEFAULT;
ALTER TYPE "OrderStatus" RENAME TO "OrderStatus_old";
CREATE TYPE "OrderStatus" AS ENUM ('PENDING', 'IN_PREPARATION', 'READY', 'CANCELED', 'FINISHED');

ALTER TABLE "Order"
ALTER COLUMN "status" TYPE "OrderStatus"
USING (
  CASE
    WHEN "status"::text = 'ACCEPTED' THEN 'IN_PREPARATION'
    ELSE "status"::text
  END
)::"OrderStatus";

ALTER TABLE "OrderStatusHistory"
ALTER COLUMN "status" TYPE "OrderStatus"
USING (
  CASE
    WHEN "status"::text = 'ACCEPTED' THEN 'IN_PREPARATION'
    ELSE "status"::text
  END
)::"OrderStatus";

DROP TYPE "OrderStatus_old";
ALTER TABLE "Order" ALTER COLUMN "status" SET DEFAULT 'PENDING';

CREATE TYPE "OrderHistoryAction" AS ENUM (
  'CREATED',
  'AUTO_ACCEPTED',
  'ACCEPTED',
  'REJECTED',
  'CUSTOMER_CANCELED',
  'STORE_CANCELED',
  'ACCEPTANCE_TIMED_OUT',
  'MARKED_READY',
  'FINISHED'
);

CREATE TYPE "OrderActorType" AS ENUM ('CUSTOMER', 'STORE_USER', 'SYSTEM', 'INTEGRATION');

CREATE TYPE "OrderCancellationType" AS ENUM (
  'CUSTOMER_CANCELED',
  'STORE_REJECTED',
  'STORE_CANCELED',
  'ACCEPTANCE_TIMEOUT'
);

-- Add state-machine metadata to orders.
ALTER TABLE "Order"
ADD COLUMN "acceptanceExpiresAt" TIMESTAMP(3),
ADD COLUMN "canceledAt" TIMESTAMP(3),
ADD COLUMN "cancellationType" "OrderCancellationType",
ADD COLUMN "publicAccessTokenHash" TEXT,
ADD COLUMN "version" INTEGER NOT NULL DEFAULT 1;

UPDATE "Order"
SET "acceptanceExpiresAt" = "createdAt" + INTERVAL '5 minutes'
WHERE "status" = 'PENDING';

UPDATE "Order"
SET
  "cancellationType" = 'STORE_CANCELED',
  "canceledAt" = "updatedAt"
WHERE "status" = 'CANCELED';

CREATE UNIQUE INDEX "Order_publicAccessTokenHash_key" ON "Order"("publicAccessTokenHash");
CREATE INDEX "Order_status_acceptanceExpiresAt_idx" ON "Order"("status", "acceptanceExpiresAt");

-- Preserve existing history while making actor information audit-friendly.
ALTER TABLE "OrderStatusHistory" DROP CONSTRAINT "OrderStatusHistory_userId_fkey";
ALTER TABLE "OrderStatusHistory" RENAME COLUMN "userId" TO "actorUserId";

ALTER TABLE "OrderStatusHistory"
ADD COLUMN "previousStatus" "OrderStatus",
ADD COLUMN "action" "OrderHistoryAction",
ADD COLUMN "actorType" "OrderActorType",
ADD COLUMN "actorNameSnapshot" TEXT;

UPDATE "OrderStatusHistory" history
SET
  "action" = CASE history."status"
    WHEN 'PENDING' THEN 'CREATED'::"OrderHistoryAction"
    WHEN 'IN_PREPARATION' THEN 'ACCEPTED'::"OrderHistoryAction"
    WHEN 'READY' THEN 'MARKED_READY'::"OrderHistoryAction"
    WHEN 'CANCELED' THEN 'STORE_CANCELED'::"OrderHistoryAction"
    WHEN 'FINISHED' THEN 'FINISHED'::"OrderHistoryAction"
  END,
  "actorType" = 'STORE_USER',
  "actorNameSnapshot" = app_user."name"
FROM "User" app_user
WHERE app_user."id" = history."actorUserId";

ALTER TABLE "OrderStatusHistory"
ALTER COLUMN "actorUserId" DROP NOT NULL,
ALTER COLUMN "action" SET NOT NULL,
ALTER COLUMN "actorType" SET NOT NULL;

ALTER TABLE "OrderStatusHistory"
ADD CONSTRAINT "OrderStatusHistory_actorUserId_fkey"
FOREIGN KEY ("actorUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Transactional outbox used by the future SSE publisher.
CREATE TABLE "OrderEventOutbox" (
  "id" BIGSERIAL NOT NULL,
  "orderId" TEXT NOT NULL,
  "storeId" TEXT NOT NULL,
  "type" TEXT NOT NULL,
  "payload" JSONB NOT NULL,
  "attempts" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "publishedAt" TIMESTAMP(3),

  CONSTRAINT "OrderEventOutbox_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "OrderEventOutbox_orderId_id_idx" ON "OrderEventOutbox"("orderId", "id");
CREATE INDEX "OrderEventOutbox_storeId_id_idx" ON "OrderEventOutbox"("storeId", "id");
CREATE INDEX "OrderEventOutbox_publishedAt_id_idx" ON "OrderEventOutbox"("publishedAt", "id");

ALTER TABLE "OrderEventOutbox"
ADD CONSTRAINT "OrderEventOutbox_orderId_fkey"
FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "OrderEventOutbox"
ADD CONSTRAINT "OrderEventOutbox_storeId_fkey"
FOREIGN KEY ("storeId") REFERENCES "Store"("id") ON DELETE CASCADE ON UPDATE CASCADE;
