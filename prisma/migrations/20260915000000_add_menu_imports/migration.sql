CREATE TABLE "MenuImport" (
  "id" TEXT NOT NULL,
  "storeId" TEXT NOT NULL,
  "provider" TEXT NOT NULL,
  "contentHash" TEXT NOT NULL,
  "categoryCount" INTEGER NOT NULL,
  "productCount" INTEGER NOT NULL,
  "groupCount" INTEGER NOT NULL,
  "optionCount" INTEGER NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "MenuImport_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "MenuImport_storeId_provider_contentHash_key"
  ON "MenuImport"("storeId", "provider", "contentHash");
CREATE INDEX "MenuImport_storeId_createdAt_idx" ON "MenuImport"("storeId", "createdAt");

ALTER TABLE "MenuImport" ADD CONSTRAINT "MenuImport_storeId_fkey"
  FOREIGN KEY ("storeId") REFERENCES "Store"("id") ON DELETE CASCADE ON UPDATE CASCADE;
