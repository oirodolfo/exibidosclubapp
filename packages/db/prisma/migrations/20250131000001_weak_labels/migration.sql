-- CreateTable
CREATE TABLE "WeakLabel" (
    "id" TEXT NOT NULL,
    "imageId" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "tagId" TEXT,
    "categoryId" TEXT,
    "confidence" DOUBLE PRECISION NOT NULL,
    "weight" DOUBLE PRECISION NOT NULL,
    "meta" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WeakLabel_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "WeakLabel_imageId_idx" ON "WeakLabel"("imageId");

-- CreateIndex
CREATE INDEX "WeakLabel_source_idx" ON "WeakLabel"("source");

-- CreateIndex
CREATE INDEX "WeakLabel_createdAt_idx" ON "WeakLabel"("createdAt");

-- AddForeignKey
ALTER TABLE "WeakLabel" ADD CONSTRAINT "WeakLabel_imageId_fkey" FOREIGN KEY ("imageId") REFERENCES "Image"("id") ON DELETE CASCADE ON UPDATE CASCADE;
