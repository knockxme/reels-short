-- AlterEnum
ALTER TYPE "SourceType" ADD VALUE 'DAILYMOTION';

-- AlterTable
ALTER TABLE "Drama" ADD COLUMN "dmPlaylistId" TEXT,
ADD COLUMN "lastSyncedAt" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "Source_type_url_idx" ON "Source"("type", "url");
