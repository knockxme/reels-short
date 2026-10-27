-- AlterTable
ALTER TABLE "Drama" ADD COLUMN     "deletedAt" TIMESTAMP(3),
ADD COLUMN     "featuredOrder" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "Episode" ADD COLUMN     "deletedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "Post" ADD COLUMN     "deletedAt" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "AdminSession" (
    "id" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "lastSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "revokedAt" TIMESTAMP(3),
    "ip" TEXT,
    "userAgent" TEXT,

    CONSTRAINT "AdminSession_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AdminSession_expiresAt_idx" ON "AdminSession"("expiresAt");

-- CreateIndex
CREATE INDEX "Drama_deletedAt_idx" ON "Drama"("deletedAt");

-- CreateIndex
CREATE INDEX "Drama_featured_featuredOrder_idx" ON "Drama"("featured", "featuredOrder");
