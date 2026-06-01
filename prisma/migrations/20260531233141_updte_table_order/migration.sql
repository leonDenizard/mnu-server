/*
  Warnings:

  - You are about to drop the column `deliveryAddressLine` on the `Order` table. All the data in the column will be lost.
  - The `deliveryAddressNumber` column on the `Order` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- AlterTable
ALTER TABLE "Order" DROP COLUMN "deliveryAddressLine",
ADD COLUMN     "deliveryStreet" TEXT,
DROP COLUMN "deliveryAddressNumber",
ADD COLUMN     "deliveryAddressNumber" INTEGER;
