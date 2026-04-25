/*
  Warnings:

  - You are about to drop the column `adressNumber` on the `Store` table. All the data in the column will be lost.
  - You are about to drop the column `latidude` on the `Store` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Store" DROP COLUMN "adressNumber",
DROP COLUMN "latidude",
ADD COLUMN     "addressNumber" TEXT,
ADD COLUMN     "latitude" DECIMAL(9,6);
