/**
 * Serve images from local storage (fallback when S3 is not used).
 * GET /api/images/serve?key=...
 */

import { NextResponse } from "next/server";
import { isLocalStorageEnabled, readFromLocal } from "@/lib/storage";

export async function GET(req: Request) {
  if (!isLocalStorageEnabled()) {
    return NextResponse.json({ error: "local_storage_not_enabled" }, { status: 404 });
  }

  const { searchParams } = new URL(req.url);
  const key = searchParams.get("key");

  if (!key || key.includes("..")) {
    return NextResponse.json({ error: "invalid_key" }, { status: 400 });
  }

  try {
    const { buffer, contentType } = readFromLocal(key);

    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "private, max-age=3600",
      },
    });
  } catch {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }
}
