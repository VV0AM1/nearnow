/*
  Warnings:

  - You are about to drop the column `boundary` on the `Neighborhood` table. All the data in the column will be lost.
  - You are about to drop the column `cityId` on the `Neighborhood` table. All the data in the column will be lost.
  - You are about to drop the `City` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `city` to the `Neighborhood` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "Neighborhood" DROP CONSTRAINT "Neighborhood_cityId_fkey";

-- AlterTable
ALTER TABLE "Neighborhood" DROP COLUMN "boundary",
DROP COLUMN "cityId",
ADD COLUMN     "city" TEXT NOT NULL,
ALTER COLUMN "radiusKm" SET DEFAULT 5.0;

-- DropTable
DROP TABLE "City";
