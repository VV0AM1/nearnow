-- CreateEnum
CREATE TYPE "SafetyLevel" AS ENUM ('SAFE', 'MODERATE', 'CAUTION', 'DANGER', 'CRITICAL');

-- AlterTable
ALTER TABLE "Neighborhood" ADD COLUMN     "safetyLevel" "SafetyLevel" NOT NULL DEFAULT 'SAFE';
