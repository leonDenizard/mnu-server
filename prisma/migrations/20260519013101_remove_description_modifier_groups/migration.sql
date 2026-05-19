/*
  Warnings:

  - You are about to drop the column `description` on the `ModifierGroup` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "ModifierGroup" DROP COLUMN "description";

-- AlterTable
ALTER TABLE "ModifierOption" ADD COLUMN     "description" TEXT;
