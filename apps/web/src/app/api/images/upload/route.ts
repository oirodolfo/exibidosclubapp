import { createHash } from "crypto";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@exibidos/db/client";
import { authOptions } from "@/lib/auth/config";
import { ensureMlMetadataForImage } from "@/lib/ml/ingest";
import { awardFirstUpload } from "@/lib/rankings";
import { isStorageConfigured, processImage, type BlurMode } from "@/lib/storage";
import { log } from "@/lib/logger";

/** Max upload size (10 MiB). Tune for product/bandwidth. */
const MAX_FILE_BYTES = 10 * 1024 * 1024;

/** MIME types accepted for upload; used for validation and storage key extension. */
const ALLOWED_MIMES = ["image/jpeg", "image/png", "image/webp"] as const;

/** Allowed visibility values for images. */
const VISIBILITY = ["public", "swipe_only"] as const;

/** Allowed blur modes when uploading (none, eyes-only, full face). */
const BLUR_MODES = ["none", "eyes", "full"] as const;

/** SHA-256 hex digest for duplicate detection. */
function sha256(buffer: Buffer): string {
  return createHash("sha256").update(buffer).digest("hex");
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    log.api.upload.warn("upload: unauthorized");
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  log.api.upload.info("upload: start", { userId: session.user.id });

  if (process.env.FEATURE_IMAGE_UPLOAD !== "true") {
    return NextResponse.json(
      { error: "image_upload_disabled" },
      { status: 403 }
    );
  }

  if (!isStorageConfigured()) {
    log.api.upload.error("upload: storage not configured (S3 or local)");
    return NextResponse.json(
      { error: "storage_unavailable" },
      { status: 503 }
    );
  }

  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    return NextResponse.json(
      { error: "invalid_body" },
      { status: 400 }
    );
  }

  const file = formData.get("file");
  if (!file || !(file instanceof File)) {
    log.api.upload.warn("upload: missing file");
    return NextResponse.json(
      { error: "missing_file" },
      { status: 400 }
    );
  }

  const mime = file.type;
  if (!ALLOWED_MIMES.includes(mime as (typeof ALLOWED_MIMES)[number])) {
    return NextResponse.json(
      { error: "invalid_type", allowed: [...ALLOWED_MIMES] },
      { status: 400 }
    );
  }

  if (file.size > MAX_FILE_BYTES) {
    return NextResponse.json(
      { error: "file_too_large", maxBytes: MAX_FILE_BYTES },
      { status: 400 }
    );
  }

  const caption = (formData.get("caption") as string | null)?.trim() || null;
  const rawVisibility = (formData.get("visibility") as string | null) || "public";
  const visibility = VISIBILITY.includes(rawVisibility as (typeof VISIBILITY)[number])
    ? (rawVisibility as (typeof VISIBILITY)[number])
    : "public";
  const rawBlurMode = (formData.get("blurMode") as string | null) || "none";
  const blurMode: BlurMode = BLUR_MODES.includes(rawBlurMode as (typeof BLUR_MODES)[number])
    ? (rawBlurMode as BlurMode)
    : "none";

  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  const contentHash = sha256(buffer);

  const userId = session.user.id;

  const existing = await prisma.image.findFirst({
    where: {
      userId,
      contentHash,
      deletedAt: null,
    },
    select: { id: true },
  });
  if (existing) {
    log.api.upload.info("upload: duplicate rejected", { contentHash: contentHash.slice(0, 12), duplicateOf: existing.id });
    return NextResponse.json(
      { error: "duplicate", duplicateOf: existing.id },
      { status: 409 }
    );
  }

  const id = crypto.randomUUID();

  let result: Awaited<ReturnType<typeof processImage>>;
  try {
    result = await processImage(userId, id, buffer, mime, blurMode);
  } catch (e) {
    log.api.upload.error("upload: process failed", e);
    return NextResponse.json(
      { error: "processing_failed" },
      { status: 500 }
    );
  }

  const image = await prisma.image.create({
    data: {
      id,
      userId,
      storageKey: result.storageKey,
      thumbKey: result.thumbKey,
      blurKey: result.blurKey,
      mimeType: mime,
      width: result.width ?? null,
      height: result.height ?? null,
      visibility,
      caption,
      blurMode: blurMode === "none" ? null : blurMode,
      blurSuggested: result.blurSuggested,
      watermarkApplied: true,
      moderationStatus: "pending",
      contentHash,
    },
    select: {
      id: true,
      caption: true,
      createdAt: true,
      moderationStatus: true,
      visibility: true,
    },
  });

  await prisma.auditLog.create({
    data: {
      actorId: userId,
      action: "image.upload",
      entityType: "Image",
      entityId: image.id,
      meta: { visibility, hasCaption: !!caption, blurMode, blurSuggested: result.blurSuggested },
    },
  });

  log.api.upload.info("upload: success", { imageId: image.id, userId, blurSuggested: result.blurSuggested });

  if (process.env.FEATURE_RANKINGS === "true") {
    const count = await prisma.image.count({ where: { userId, deletedAt: null } });
    if (count === 1) {
      try {
        await awardFirstUpload(userId);
      } catch {
        // non-fatal
      }
    }
  }

  // ML metadata ingestion: run ONCE on upload; persisted for IMS (no inference in IMS requests)
  try {
    await ensureMlMetadataForImage(image.id, buffer);
  } catch (e) {
    log.api.upload.ml.warn("upload: ml metadata ingest failed (non-fatal)", e);
    // Non-fatal: image is already created; metadata can be backfilled
  }

  return NextResponse.json(image, { status: 201 });
}
