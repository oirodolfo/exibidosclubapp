import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@exibidos/db/client";
import { authOptions } from "@/lib/auth/config";
import { getSignedDownloadUrl, isS3Configured } from "@/lib/storage";

const PAGE_SIZE = 10;

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  if (process.env.FEATURE_SWIPE !== "true") {
    return NextResponse.json({ error: "swipe_disabled" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const cursor = searchParams.get("cursor");
  const limit = Math.min(Number(searchParams.get("limit")) || PAGE_SIZE, 20);

  const swipedIds = await prisma.swipe
    .findMany({
      where: { userId: session.user.id },
      select: { imageId: true },
    })
    .then((r) => r.map((s) => s.imageId));

  const images = await prisma.image.findMany({
    where: {
      id: { notIn: swipedIds },
      userId: { not: session.user.id },
      deletedAt: null,
      visibility: { in: ["public", "swipe_only"] },
      moderationStatus: { in: ["approved", "pending"] },
    },
    orderBy: [{ rankingScore: "desc" }, { createdAt: "desc" }],
    take: limit + 1,
    ...(cursor && { cursor: { id: cursor }, skip: 1 }),
    select: {
      id: true,
      caption: true,
      createdAt: true,
      thumbKey: true,
      watermarkedKey: true,
      user: {
        select: {
          id: true,
          name: true,
          slugs: { select: { slug: true }, take: 1 },
        },
      },
    },
  });

  const hasMore = images.length > limit;
  const items = hasMore ? images.slice(0, limit) : images;
  const nextCursor = hasMore ? items[items.length - 1]?.id : null;

  const withUrls = await (async () => {
    if (!isS3Configured()) {
      return items.map((img) => ({
        ...img,
        thumbUrl: null as string | null,
        imageUrl: null as string | null,
      }));
    }
    return Promise.all(
      items.map(async (img) => {
        const thumbUrl = img.thumbKey
          ? await getSignedDownloadUrl(img.thumbKey, 3600).catch(() => null)
          : null;
        const imageKey = img.watermarkedKey ?? img.thumbKey ?? null;
        const imageUrl = imageKey
          ? await getSignedDownloadUrl(imageKey, 3600).catch(() => null)
          : thumbUrl;
        return { ...img, thumbUrl, imageUrl };
      })
    );
  })();

  const feed = withUrls.map((img) => ({
    id: img.id,
    thumbUrl: img.thumbUrl,
    imageUrl: img.imageUrl ?? img.thumbUrl,
    caption: img.caption,
    createdAt: img.createdAt,
    owner: {
      id: img.user.id,
      name: img.user.name,
      slug: img.user.slugs[0]?.slug ?? null,
    },
  }));

  return NextResponse.json({ feed, nextCursor, hasMore });
}
