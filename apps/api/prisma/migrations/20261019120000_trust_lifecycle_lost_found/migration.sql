-- CreateEnum
CREATE TYPE "PostStatus" AS ENUM ('ACTIVE', 'RESOLVED', 'EXPIRED', 'REMOVED');

-- CreateEnum
CREATE TYPE "VerificationStatus" AS ENUM ('UNVERIFIED', 'COMMUNITY_CONFIRMED', 'OFFICIAL_SOURCE');

-- CreateEnum
CREATE TYPE "SourceType" AS ENUM ('COMMUNITY', 'OFFICIAL');

-- CreateEnum
CREATE TYPE "ConfirmationState" AS ENUM ('STILL_HAPPENING', 'NO_LONGER_PRESENT');

-- CreateEnum
CREATE TYPE "LostFoundDirection" AS ENUM ('LOST', 'FOUND');

-- CreateEnum
CREATE TYPE "LostFoundItemType" AS ENUM ('KEYS', 'WALLET_BAG', 'ELECTRONICS', 'DOCUMENT', 'PET', 'CLOTHING', 'OTHER');

-- CreateEnum
CREATE TYPE "LostFoundStatus" AS ENUM ('OPEN', 'RETURNED', 'CLOSED');

-- CreateEnum
CREATE TYPE "ContactRequestStatus" AS ENUM ('PENDING', 'ACCEPTED', 'DECLINED', 'BLOCKED');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "NotificationType" ADD VALUE 'COMMENT';
ALTER TYPE "NotificationType" ADD VALUE 'POST_UPDATE';
ALTER TYPE "NotificationType" ADD VALUE 'MATCH_SUGGESTION';
ALTER TYPE "NotificationType" ADD VALUE 'CONTACT_REQUEST';

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "deletedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "Auth" ADD COLUMN     "otpAttempts" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "NotificationSettings" ADD COLUMN     "areaLabel" TEXT,
ADD COLUMN     "paused" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "quietHoursEnd" INTEGER,
ADD COLUMN     "quietHoursStart" INTEGER,
ADD COLUMN     "timezone" TEXT,
ALTER COLUMN "emailAlerts" SET DEFAULT false,
ALTER COLUMN "pushAlerts" SET DEFAULT false,
ALTER COLUMN "pushEnabled" SET DEFAULT false,
ALTER COLUMN "radiusKm" SET DEFAULT 2.0,
ALTER COLUMN "latitude" DROP NOT NULL,
ALTER COLUMN "latitude" DROP DEFAULT,
ALTER COLUMN "longitude" DROP NOT NULL,
ALTER COLUMN "longitude" DROP DEFAULT;

-- AlterTable
ALTER TABLE "Post" ADD COLUMN     "expiresAt" TIMESTAMP(3),
ADD COLUMN     "isApproximateLocation" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "lastConfirmedAt" TIMESTAMP(3),
ADD COLUMN     "resolutionNote" TEXT,
ADD COLUMN     "resolvedAt" TIMESTAMP(3),
ADD COLUMN     "resolvedById" TEXT,
ADD COLUMN     "sourceExternalId" TEXT,
ADD COLUMN     "sourceName" TEXT,
ADD COLUMN     "sourceType" "SourceType" NOT NULL DEFAULT 'COMMUNITY',
ADD COLUMN     "sourceUrl" TEXT,
ADD COLUMN     "status" "PostStatus" NOT NULL DEFAULT 'ACTIVE',
ADD COLUMN     "verificationStatus" "VerificationStatus" NOT NULL DEFAULT 'UNVERIFIED';

-- AlterTable
ALTER TABLE "Report" ADD COLUMN     "details" TEXT,
ADD COLUMN     "reviewedAt" TIMESTAMP(3),
ADD COLUMN     "reviewedById" TEXT;

-- CreateTable
CREATE TABLE "DeviceToken" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "platform" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "revokedAt" TIMESTAMP(3),

    CONSTRAINT "DeviceToken_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PostConfirmation" (
    "id" TEXT NOT NULL,
    "state" "ConfirmationState" NOT NULL,
    "postId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PostConfirmation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ModerationAction" (
    "id" TEXT NOT NULL,
    "actorId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "targetType" TEXT NOT NULL,
    "targetId" TEXT NOT NULL,
    "reason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ModerationAction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LostFoundItem" (
    "id" TEXT NOT NULL,
    "postId" TEXT NOT NULL,
    "direction" "LostFoundDirection" NOT NULL,
    "itemType" "LostFoundItemType" NOT NULL,
    "occurredFrom" TIMESTAMP(3) NOT NULL,
    "occurredTo" TIMESTAMP(3) NOT NULL,
    "status" "LostFoundStatus" NOT NULL DEFAULT 'OPEN',
    "resolvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LostFoundItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LostFoundMatchDismissal" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "sourcePostId" TEXT NOT NULL,
    "candidatePostId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LostFoundMatchDismissal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ContactRequest" (
    "id" TEXT NOT NULL,
    "postId" TEXT NOT NULL,
    "relatedPostId" TEXT,
    "requesterId" TEXT NOT NULL,
    "recipientId" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "status" "ContactRequestStatus" NOT NULL DEFAULT 'PENDING',
    "responseMessage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "respondedAt" TIMESTAMP(3),

    CONSTRAINT "ContactRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserBlock" (
    "id" TEXT NOT NULL,
    "blockerId" TEXT NOT NULL,
    "blockedId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserBlock_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "DeviceToken_token_key" ON "DeviceToken"("token");

-- CreateIndex
CREATE INDEX "DeviceToken_userId_idx" ON "DeviceToken"("userId");

-- CreateIndex
CREATE INDEX "PostConfirmation_postId_state_idx" ON "PostConfirmation"("postId", "state");

-- CreateIndex
CREATE UNIQUE INDEX "PostConfirmation_postId_userId_key" ON "PostConfirmation"("postId", "userId");

-- CreateIndex
CREATE INDEX "ModerationAction_targetType_targetId_idx" ON "ModerationAction"("targetType", "targetId");

-- CreateIndex
CREATE INDEX "ModerationAction_actorId_idx" ON "ModerationAction"("actorId");

-- CreateIndex
CREATE UNIQUE INDEX "LostFoundItem_postId_key" ON "LostFoundItem"("postId");

-- CreateIndex
CREATE INDEX "LostFoundItem_direction_itemType_status_idx" ON "LostFoundItem"("direction", "itemType", "status");

-- CreateIndex
CREATE UNIQUE INDEX "LostFoundMatchDismissal_userId_sourcePostId_candidatePostId_key" ON "LostFoundMatchDismissal"("userId", "sourcePostId", "candidatePostId");

-- CreateIndex
CREATE INDEX "ContactRequest_recipientId_status_idx" ON "ContactRequest"("recipientId", "status");

-- CreateIndex
CREATE INDEX "ContactRequest_requesterId_idx" ON "ContactRequest"("requesterId");

-- CreateIndex
CREATE INDEX "ContactRequest_postId_idx" ON "ContactRequest"("postId");

-- CreateIndex
CREATE UNIQUE INDEX "UserBlock_blockerId_blockedId_key" ON "UserBlock"("blockerId", "blockedId");

-- CreateIndex
CREATE INDEX "Notification_userId_postId_type_idx" ON "Notification"("userId", "postId", "type");

-- CreateIndex
CREATE INDEX "NotificationSettings_latitude_longitude_idx" ON "NotificationSettings"("latitude", "longitude");

-- CreateIndex
CREATE INDEX "Post_status_expiresAt_idx" ON "Post"("status", "expiresAt");

-- CreateIndex
CREATE INDEX "Post_category_createdAt_idx" ON "Post"("category", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "Post_sourceName_sourceExternalId_key" ON "Post"("sourceName", "sourceExternalId");

-- CreateIndex
CREATE INDEX "Report_postId_reporterId_idx" ON "Report"("postId", "reporterId");

-- AddForeignKey
ALTER TABLE "DeviceToken" ADD CONSTRAINT "DeviceToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PostConfirmation" ADD CONSTRAINT "PostConfirmation_postId_fkey" FOREIGN KEY ("postId") REFERENCES "Post"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PostConfirmation" ADD CONSTRAINT "PostConfirmation_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ModerationAction" ADD CONSTRAINT "ModerationAction_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LostFoundItem" ADD CONSTRAINT "LostFoundItem_postId_fkey" FOREIGN KEY ("postId") REFERENCES "Post"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContactRequest" ADD CONSTRAINT "ContactRequest_requesterId_fkey" FOREIGN KEY ("requesterId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContactRequest" ADD CONSTRAINT "ContactRequest_recipientId_fkey" FOREIGN KEY ("recipientId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserBlock" ADD CONSTRAINT "UserBlock_blockerId_fkey" FOREIGN KEY ("blockerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserBlock" ADD CONSTRAINT "UserBlock_blockedId_fkey" FOREIGN KEY ("blockedId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;


-- ---------------------------------------------------------------------------
-- Data backfill (non-destructive)
-- ---------------------------------------------------------------------------

-- (0,0) was used as "no alert area". Represent "unset" explicitly instead so
-- nobody receives alerts for the Gulf of Guinea.
UPDATE "NotificationSettings"
SET "latitude" = NULL, "longitude" = NULL
WHERE "latitude" = 0 AND "longitude" = 0;

-- Give existing posts the same category-based lifetime that new posts get, so
-- old reports are shown as expired rather than as current information.
UPDATE "Post" SET "expiresAt" = "createdAt" + CASE "category"
    WHEN 'DANGER' THEN INTERVAL '2 hours'
    WHEN 'CRIME' THEN INTERVAL '48 hours'
    WHEN 'SAFETY' THEN INTERVAL '48 hours'
    WHEN 'GENERAL' THEN INTERVAL '7 days'
    WHEN 'EVENT' THEN INTERVAL '14 days'
    WHEN 'LOST_FOUND' THEN INTERVAL '30 days'
    WHEN 'RECOMMENDATION' THEN INTERVAL '90 days'
    ELSE INTERVAL '7 days'
END
WHERE "expiresAt" IS NULL;
