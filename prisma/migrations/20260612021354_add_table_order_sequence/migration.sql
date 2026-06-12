-- CreateTable
CREATE TABLE "OrderSequence" (
    "id" TEXT NOT NULL,
    "storeId" TEXT NOT NULL,
    "sequenceKey" TEXT NOT NULL,
    "current" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "OrderSequence_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "OrderSequence_storeId_sequenceKey_key" ON "OrderSequence"("storeId", "sequenceKey");
