-- CreateTable
CREATE TABLE "SavedArea" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "latitude" DOUBLE PRECISION NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,
    "radiusKm" DOUBLE PRECISION NOT NULL DEFAULT 2,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SavedArea_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BriefPreferences" (
    "userId" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "categories" "Category"[] DEFAULT ARRAY[]::"Category"[],
    "lastSeenAt" TIMESTAMP(3),
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BriefPreferences_pkey" PRIMARY KEY ("userId")
);

-- CreateIndex
CREATE INDEX "SavedArea_userId_idx" ON "SavedArea"("userId");

-- AddForeignKey
ALTER TABLE "SavedArea" ADD CONSTRAINT "SavedArea_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BriefPreferences" ADD CONSTRAINT "BriefPreferences_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
