import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@exibidos/db/client";
import { getActiveModelVersion } from "@exibidos/ml-registry-client";
import { authOptions } from "@/lib/auth/config";
import { ensureMlMetadataForImage } from "@/lib/ml/ingest";
import { log } from "@/lib/logger";

/** POST: Trigger ML processing for an image (or all pending). Admin or owner. */
export async function POST(req: Request) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  if (process.env.FEATURE_ML_PIPELINE !== "true") {
    return NextResponse.json({ error: "ml_disabled" }, { status: 403 });
  }

  const body = (await req.json().catch(() => ({}))) as { imageId?: string };
  const imageId = body.imageId;

  if (imageId) {
    const img = await prisma.image.findUnique({
      where: { id: imageId, deletedAt: null },
      select: { userId: true },
    });

    if (!img) return NextResponse.json({ error: "not_found" }, { status: 404 });

    if (img.userId !== session.user.id && (session.user as { role?: string }).role !== "admin") {
      return NextResponse.json({ error: "forbidden" }, { status: 403 });
    }

    try {
      const registryUrl = process.env.ML_MODEL_REGISTRY_URL;
      const activeModelVersion = registryUrl
        ? await getActiveModelVersion({ baseUrl: registryUrl })
        : null;

      if (activeModelVersion) log.ml.info("process: active model from registry", { activeModelVersion });
      await ensureMlMetadataForImage(imageId);
      log.ml.info("process: single image", { imageId });

      return NextResponse.json({ ok: true, processed: 1 });
    } catch (e) {
      log.ml.error("process: failed", e);

      return NextResponse.json({ error: "processing_failed" }, { status: 500 });
    }
  }

  const pending = await prisma.image.findMany({
    where: {
      deletedAt: null,
      imageMlMetadata: null,
    },
    take: 50,
    select: { id: true },
  });
  let count = 0;

  for (const img of pending) {
    try {
      await ensureMlMetadataForImage(img.id);
      count++;
    } catch {
      log.ml.warn("process: skip image", { imageId: img.id });
    }
  }
  log.ml.info("process: batch", { count, total: pending.length });

  return NextResponse.json({ ok: true, processed: count });
}
