import { NextResponse } from "next/server";
import { prisma } from "@exibidos/db/client";
import { getSignedDownloadUrl, isStorageConfigured } from "@/lib/storage";

const PERIODS = ["daily", "weekly", "monthly", "alltime"] as const;

export async function GET(req: Request) {
  if (process.env.FEATURE_RANKINGS !== "true") {
    return NextResponse.json({ error: "rankings_disabled" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const period = (searchParams.get("period") ?? "weekly") as (typeof PERIODS)[number];
  const categoryId = searchParams.get("categoryId") ?? null;
  const limit = Math.min(Number(searchParams.get("limit")) || 20, 50);

  if (!PERIODS.includes(period)) {
    return NextResponse.json({ error: "invalid_period" }, { status: 400 });
  }

  const since = (() => {
    const now = new Date();
    if (period === "daily") {
      const d = new Date(now);
      d.setHours(0, 0, 0, 0);
      return d;
    }
    if (period === "weekly") {
      const d = new Date(now);
      d.setDate(d.getDate() - 7);
      return d;
    }
    if (period === "monthly") {
      const d = new Date(now);
      d.setMonth(d.getMonth() - 1);
      return d;
    }
    return new Date(0);
  })();

  const swipes = await prisma.swipe.groupBy({
    by: ["imageId"],
    where: {
      direction: "like",
      createdAt: { gte: since },
      ...(categoryId && { categoryId }),
    },
    _count: { imageId: true },
    orderBy: { _count: { imageId: "desc" } },
    take: limit,
  });

  const imageIds = swipes.map((s) => s.imageId);
  if (imageIds.length === 0) {
    return NextResponse.json({ rankings: [], period });
  }

  const images = await prisma.image.findMany({
    where: { id: { in: imageIds }, deletedAt: null },
    include: {
      user: { select: { id: true, name: true }, include: { slugs: { select: { slug: true }, take: 1 } } },
    },
  });
  const byId = Object.fromEntries(images.map((i) => [i.id, i]));
  const scoreById = Object.fromEntries(swipes.map((s) => [s.imageId, s._count.imageId]));

  let items = swipes
    .map((s, idx) => {
      const img = byId[s.imageId];
      return img
        ? {
            rank: idx + 1,
            imageId: img.id,
            score: scoreById[s.imageId] ?? 0,
            thumbKey: img.thumbKey,
            caption: img.caption,
            owner: {
              id: img.user.id,
              name: img.user.name,
              slug: img.user.slugs[0]?.slug ?? null,
            },
          }
        : null;
    })
    .filter(Boolean) as {
    rank: number;
    imageId: string;
    score: number;
    thumbKey: string | null;
    caption: string | null;
    owner: { id: string; name: string | null; slug: string | null };
  }[];

  if (isStorageConfigured()) {
    items = await Promise.all(
      items.map(async (r) => {
        const thumbUrl = r.thumbKey
          ? await getSignedDownloadUrl(r.thumbKey, 3600).catch(() => null)
          : null;
        return { ...r, thumbUrl };
      })
    );
  } else {
    items = items.map((r) => ({ ...r, thumbUrl: null as string | null }));
  }

  return NextResponse.json({ rankings: items, period });
}
