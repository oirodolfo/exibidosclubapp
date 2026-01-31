-- CreateTable
CREATE TABLE "ImageMlMetadata" (
    "id" TEXT NOT NULL,
    "imageId" TEXT NOT NULL,
    "contractVersion" INTEGER NOT NULL,
    "data" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ImageMlMetadata_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ImageMlMetadata_imageId_key" ON "ImageMlMetadata"("imageId");

-- CreateIndex
CREATE INDEX "ImageMlMetadata_contractVersion_idx" ON "ImageMlMetadata"("contractVersion");

-- AddForeignKey
ALTER TABLE "ImageMlMetadata" ADD CONSTRAINT "ImageMlMetadata_imageId_fkey" FOREIGN KEY ("imageId") REFERENCES "Image"("id") ON DELETE CASCADE ON UPDATE CASCADE;
