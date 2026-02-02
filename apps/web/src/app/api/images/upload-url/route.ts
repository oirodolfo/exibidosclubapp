import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@exibidos/db";
import { authOptions } from "@/lib/auth/config";
import {
  isR2Configured,
  getPresignedUploadUrl,
  originalKey,
} from "@/lib/storage/r2-presign";

const MAX_FILE_BYTES = 10 * 1024 * 1024;
const ALLOWED_MIMES = ["image/jpeg", "image/png", "image/webp"] as const;
const EXPIRES_IN = 900;

const extFromMime: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  if (!isR2Configured()) {
    return NextResponse.json(
      { error: "storage_unavailable" },
      { status: 503 }
    );
  }

  let body: { mimeType?: string; contentLength?: number };

  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid_body" }, { status: 400 });
  }

  const mimeType = body.mimeType ?? "image/jpeg";
  if (!ALLOWED_MIMES.includes(mimeType as (typeof ALLOWED_MIMES)[number])) {
    return NextResponse.json(
      { error: "invalid_type", allowed: [...ALLOWED_MIMES] },
      { status: 400 }
    );
  }

  const contentLength = body.contentLength ?? 0;
  if (contentLength > MAX_FILE_BYTES || contentLength <= 0) {
    return NextResponse.json(
      { error: "invalid_size", maxBytes: MAX_FILE_BYTES },
      { status: 400 }
    );
  }

  const ext = extFromMime[mimeType] ?? "jpg";
  const userId = session.user.id;
  const imageId = crypto.randomUUID();
  const key = originalKey(userId, imageId, ext);

  const uploadUrl = await getPresignedUploadUrl(key, mimeType, EXPIRES_IN);

  await prisma.image.create({
    data: {
      id: imageId,
      userId,
      storageKey: key,
      mimeType,
      moderationStatus: "pending",
    },
  });

  return NextResponse.json({
    uploadUrl,
    imageId,
    key,
    expiresIn: EXPIRES_IN,
  });
}
