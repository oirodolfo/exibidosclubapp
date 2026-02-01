import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { extFromMime, isStorageConfigured, upload } from "@/lib/storage";
import { prisma } from "@exibidos/db/client";

const MAX_AVATAR_BYTES = 2 * 1024 * 1024; // 2 MiB
const ALLOWED_MIMES = ["image/jpeg", "image/png", "image/webp"] as const;
const env = process.env.NODE_ENV ?? "development";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  if (!isStorageConfigured()) {
    return NextResponse.json(
      { error: "storage_unavailable" },
      { status: 503 }
    );
  }

  let formData: FormData;

  try {
    formData = await req.formData();
  } catch {
    return NextResponse.json({ error: "invalid_body" }, { status: 400 });
  }

  const file = formData.get("file");

  if (!file || !(file instanceof File)) {
    return NextResponse.json({ error: "missing_file" }, { status: 400 });
  }

  const mime = file.type;

  if (!ALLOWED_MIMES.includes(mime as (typeof ALLOWED_MIMES)[number])) {
    return NextResponse.json(
      { error: "invalid_type", allowed: [...ALLOWED_MIMES] },
      { status: 400 }
    );
  }

  if (file.size > MAX_AVATAR_BYTES) {
    return NextResponse.json(
      { error: "file_too_large", maxBytes: MAX_AVATAR_BYTES },
      { status: 400 }
    );
  }

  const userId = session.user.id;
  const ext = extFromMime(mime);
  const id = crypto.randomUUID();
  const key = `${env}/avatars/${userId}/${id}.${ext}`;

  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  try {
    await upload(key, buffer, mime);
  } catch (e) {
    return NextResponse.json(
      { error: "upload_failed" },
      { status: 500 }
    );
  }

  await prisma.profile.upsert({
    where: { userId },
    create: { userId, avatarKey: key },
    update: { avatarKey: key },
  });

  return NextResponse.json({ ok: true, avatarKey: key }, { status: 200 });
}
