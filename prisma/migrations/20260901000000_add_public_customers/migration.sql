CREATE TABLE "Customer" (
  "id" TEXT NOT NULL,
  "storeId" TEXT NOT NULL,
  "phoneNormalized" TEXT NOT NULL,
  "name" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Customer_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "CustomerAccessLink" (
  "id" TEXT NOT NULL,
  "customerId" TEXT NOT NULL,
  "shortIdHash" TEXT NOT NULL,
  "revokedAt" TIMESTAMP(3),
  "lastAccessAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "CustomerAccessLink_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "CustomerAccessLog" (
  "id" TEXT NOT NULL,
  "accessLinkId" TEXT NOT NULL,
  "ipAddress" TEXT,
  "userAgent" TEXT,
  "deviceIdHash" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "CustomerAccessLog_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "Order" ADD COLUMN "customerId" TEXT;

CREATE UNIQUE INDEX "Customer_storeId_phoneNormalized_key" ON "Customer"("storeId", "phoneNormalized");
CREATE INDEX "Customer_storeId_createdAt_idx" ON "Customer"("storeId", "createdAt");
CREATE UNIQUE INDEX "CustomerAccessLink_shortIdHash_key" ON "CustomerAccessLink"("shortIdHash");
CREATE INDEX "CustomerAccessLink_customerId_revokedAt_idx" ON "CustomerAccessLink"("customerId", "revokedAt");
CREATE INDEX "CustomerAccessLog_accessLinkId_createdAt_idx" ON "CustomerAccessLog"("accessLinkId", "createdAt");
CREATE INDEX "Order_customerId_createdAt_idx" ON "Order"("customerId", "createdAt");

ALTER TABLE "Customer" ADD CONSTRAINT "Customer_storeId_fkey"
  FOREIGN KEY ("storeId") REFERENCES "Store"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Order" ADD CONSTRAINT "Order_customerId_fkey"
  FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "CustomerAccessLink" ADD CONSTRAINT "CustomerAccessLink_customerId_fkey"
  FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CustomerAccessLog" ADD CONSTRAINT "CustomerAccessLog_accessLinkId_fkey"
  FOREIGN KEY ("accessLinkId") REFERENCES "CustomerAccessLink"("id") ON DELETE CASCADE ON UPDATE CASCADE;
