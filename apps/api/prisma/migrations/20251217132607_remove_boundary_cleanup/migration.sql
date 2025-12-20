/*
  Warnings:

  - You are about to drop the column `city` on the `Neighborhood` table. All the data in the column will be lost.
  - Added the required column `cityId` to the `Neighborhood` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Neighborhood" DROP COLUMN "city",
ADD COLUMN     "cityId" TEXT NOT NULL,
ALTER COLUMN "radiusKm" SET DEFAULT 1.0;

-- CreateTable
CREATE TABLE "City" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "country" TEXT NOT NULL,
    "latitude" DOUBLE PRECISION NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "City_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "City_name_key" ON "City"("name");

-- AddForeignKey
ALTER TABLE "Neighborhood" ADD CONSTRAINT "Neighborhood_cityId_fkey" FOREIGN KEY ("cityId") REFERENCES "City"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
