-- CreateEnum
CREATE TYPE "OrderSequenceMode" AS ENUM ('DAILY', 'CONTINUOUS');

-- AlterTable
ALTER TABLE "Store" ADD COLUMN     "orderSequenceMode" "OrderSequenceMode" NOT NULL DEFAULT 'CONTINUOUS';

-- CreateIndex
CREATE INDEX "OrderSequence_storeId_idx" ON "OrderSequence"("storeId");

-- AddForeignKey
ALTER TABLE "OrderSequence" ADD CONSTRAINT "OrderSequence_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "Store"("id") ON DELETE CASCADE ON UPDATE CASCADE;
