-- CreateEnum
CREATE TYPE "DramaStatus" AS ENUM ('ONGOING', 'COMPLETED', 'UPCOMING');

-- CreateEnum
CREATE TYPE "DramaType" AS ENUM ('SERIES', 'MOVIE', 'SHORT');

-- CreateEnum
CREATE TYPE "SourceType" AS ENUM ('IFRAME', 'HLS', 'MP4');

-- CreateTable
CREATE TABLE "Drama" (
    "id" SERIAL NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "altTitles" TEXT[],
    "synopsis" TEXT NOT NULL,
    "posterUrl" TEXT NOT NULL,
    "bannerUrl" TEXT,
    "trailerUrl" TEXT,
    "year" INTEGER,
    "type" "DramaType" NOT NULL DEFAULT 'SERIES',
    "status" "DramaStatus" NOT NULL DEFAULT 'ONGOING',
    "totalEpisodes" INTEGER,
    "network" TEXT,
    "rating" DOUBLE PRECISION,
    "views" INTEGER NOT NULL DEFAULT 0,
    "featured" BOOLEAN NOT NULL DEFAULT false,
    "published" BOOLEAN NOT NULL DEFAULT true,
    "seoTitle" TEXT,
    "seoDescription" TEXT,
    "countryId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Drama_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Episode" (
    "id" SERIAL NOT NULL,
    "dramaId" INTEGER NOT NULL,
    "number" INTEGER NOT NULL,
    "title" TEXT,
    "synopsis" TEXT,
    "thumbnailUrl" TEXT,
    "durationSec" INTEGER,
    "airDate" TIMESTAMP(3),
    "published" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Episode_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Source" (
    "id" SERIAL NOT NULL,
    "episodeId" INTEGER NOT NULL,
    "label" TEXT NOT NULL DEFAULT 'Server 1',
    "type" "SourceType" NOT NULL,
    "url" TEXT NOT NULL,
    "priority" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "lastCheckedAt" TIMESTAMP(3),
    "lastStatus" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Source_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Genre" (
    "id" SERIAL NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,

    CONSTRAINT "Genre_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Country" (
    "id" SERIAL NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,

    CONSTRAINT "Country_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Actor" (
    "id" SERIAL NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "photoUrl" TEXT,
    "bio" TEXT,

    CONSTRAINT "Actor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Post" (
    "id" SERIAL NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "excerpt" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "coverUrl" TEXT,
    "published" BOOLEAN NOT NULL DEFAULT true,
    "publishedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Post_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_DramaToGenre" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL,

    CONSTRAINT "_DramaToGenre_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateTable
CREATE TABLE "_ActorToDrama" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL,

    CONSTRAINT "_ActorToDrama_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE UNIQUE INDEX "Drama_slug_key" ON "Drama"("slug");

-- CreateIndex
CREATE INDEX "Drama_published_updatedAt_idx" ON "Drama"("published", "updatedAt");

-- CreateIndex
CREATE INDEX "Drama_published_views_idx" ON "Drama"("published", "views");

-- CreateIndex
CREATE INDEX "Drama_year_idx" ON "Drama"("year");

-- CreateIndex
CREATE INDEX "Episode_published_createdAt_idx" ON "Episode"("published", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "Episode_dramaId_number_key" ON "Episode"("dramaId", "number");

-- CreateIndex
CREATE INDEX "Source_episodeId_priority_idx" ON "Source"("episodeId", "priority");

-- CreateIndex
CREATE UNIQUE INDEX "Genre_slug_key" ON "Genre"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Country_slug_key" ON "Country"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Actor_slug_key" ON "Actor"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Post_slug_key" ON "Post"("slug");

-- CreateIndex
CREATE INDEX "Post_published_publishedAt_idx" ON "Post"("published", "publishedAt");

-- CreateIndex
CREATE INDEX "_DramaToGenre_B_index" ON "_DramaToGenre"("B");

-- CreateIndex
CREATE INDEX "_ActorToDrama_B_index" ON "_ActorToDrama"("B");

-- AddForeignKey
ALTER TABLE "Drama" ADD CONSTRAINT "Drama_countryId_fkey" FOREIGN KEY ("countryId") REFERENCES "Country"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Episode" ADD CONSTRAINT "Episode_dramaId_fkey" FOREIGN KEY ("dramaId") REFERENCES "Drama"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Source" ADD CONSTRAINT "Source_episodeId_fkey" FOREIGN KEY ("episodeId") REFERENCES "Episode"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_DramaToGenre" ADD CONSTRAINT "_DramaToGenre_A_fkey" FOREIGN KEY ("A") REFERENCES "Drama"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_DramaToGenre" ADD CONSTRAINT "_DramaToGenre_B_fkey" FOREIGN KEY ("B") REFERENCES "Genre"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ActorToDrama" ADD CONSTRAINT "_ActorToDrama_A_fkey" FOREIGN KEY ("A") REFERENCES "Actor"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ActorToDrama" ADD CONSTRAINT "_ActorToDrama_B_fkey" FOREIGN KEY ("B") REFERENCES "Drama"("id") ON DELETE CASCADE ON UPDATE CASCADE;
