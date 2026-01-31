-- AlterTable
ALTER TABLE "Image" ADD COLUMN "mediaType" TEXT DEFAULT 'image',
ADD COLUMN "rankingScore" DOUBLE PRECISION;

-- CreateIndex
CREATE INDEX "Image_rankingScore_createdAt_idx" ON "Image"("rankingScore" DESC, "createdAt" DESC);
