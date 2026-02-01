/**
 * GET /api/search/megasearch — instant search, light index.
 * Delegates to search domain controller; enriches photos with thumbUrl for UI.
 */

import { NextResponse } from "next/server";
import { megasearch } from "@/search/controllers/megasearch.controller";
import { getSignedDownloadUrl, isStorageConfigured } from "@/lib/storage";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q") ?? "";

  const result = await megasearch({ q });

  if (!result.ok) {
    return NextResponse.json(
      { error: result.error },
      { status: result.status }
    );
  }

  const data = result.data;

  if (isStorageConfigured() && data.photos.length > 0) {
    const photosWithUrl = await Promise.all(
      data.photos.map(async (p) => {
        const thumbUrl = p.thumbKey
          ? await getSignedDownloadUrl(p.thumbKey, 3600)
          : null;

        return { ...p, thumbUrl };
      })
    );

    return NextResponse.json({ ...data, photos: photosWithUrl });
  }

  return NextResponse.json(data);
}
