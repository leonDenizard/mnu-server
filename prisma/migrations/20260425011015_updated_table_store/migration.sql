-- CreateEnum
CREATE TYPE "Weekday" AS ENUM ('SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY');

-- AlterTable
ALTER TABLE "Store" ADD COLUMN     "addressLine" TEXT,
ADD COLUMN     "adressNumber" TEXT,
ADD COLUMN     "city" TEXT,
ADD COLUMN     "deliveryFeeCents" INTEGER,
ADD COLUMN     "deliveryRadiusKm" DECIMAL(5,2),
ADD COLUMN     "isOpen" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "latidude" DECIMAL(9,6),
ADD COLUMN     "longitude" DECIMAL(9,6),
ADD COLUMN     "neighborhood" TEXT,
ADD COLUMN     "phone" TEXT,
ADD COLUMN     "state" TEXT,
ADD COLUMN     "supportsDelivery" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "supportsDineIn" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "supportsPickup" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "whatsapp" TEXT,
ADD COLUMN     "zipCode" TEXT;

-- CreateTable
CREATE TABLE "StoreOperatingHour" (
    "id" TEXT NOT NULL,
    "weekday" "Weekday" NOT NULL,
    "openTime" TEXT NOT NULL,
    "closeTime" TEXT NOT NULL,
    "storeId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StoreOperatingHour_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "StoreOperatingHour_storeId_idx" ON "StoreOperatingHour"("storeId");

-- CreateIndex
CREATE INDEX "StoreOperatingHour_storeId_weekday_idx" ON "StoreOperatingHour"("storeId", "weekday");

-- AddForeignKey
ALTER TABLE "StoreOperatingHour" ADD CONSTRAINT "StoreOperatingHour_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "Store"("id") ON DELETE CASCADE ON UPDATE CASCADE;
