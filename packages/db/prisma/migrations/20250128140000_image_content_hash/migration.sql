-- AlterTable
ALTER TABLE "Image" ADD COLUMN "contentHash" TEXT;

-- CreateIndex
CREATE INDEX "Image_userId_contentHash_idx" ON "Image"("userId", "contentHash");
