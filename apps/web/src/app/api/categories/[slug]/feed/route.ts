import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@exibidos/db/client";
import { authOptions } from "@/lib/auth/config";
import { getSignedDownloadUrl, isS3Configured } from "@/lib/storage";

const PAGE_SIZE = 12;

export async function GET(
  req: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const category = await prisma.category.findUnique({
    where: { slug },
    select: { id: true },
  });
  if (!category) return NextResponse.json({ error: "not_found" }, { status: 404 });

  const { searchParams } = new URL(req.url);
  const cursor = searchParams.get("cursor");
  const limit = Math.min(Number(searchParams.get("limit")) || PAGE_SIZE, 24);

  const tagIds = await prisma.tag.findMany({
    where: { categoryId: category.id },
    select: { id: true },
  }).then((r) => r.map((t) => t.id));

  if (tagIds.length === 0) {
    return NextResponse.json({ feed: [], nextCursor: null, hasMore: false });
  }

  const images = await prisma.image.findMany({
    where: {
      deletedAt: null,
      visibility: "public",
      moderationStatus: { in: ["approved", "pending"] },
      imageTags: { some: { tagId: { in: tagIds } } },
    },
    orderBy: [{ rankingScore: "desc" }, { createdAt: "desc" }],
    take: limit + 1,
    ...(cursor && { cursor: { id: cursor }, skip: 1 }),
    include: {
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
      return items.map((img) => ({ ...img, thumbUrl: null as string | null }));
    }
    return Promise.all(
      items.map(async (img) => {
        const thumbUrl = img.thumbKey
          ? await getSignedDownloadUrl(img.thumbKey, 3600).catch(() => null)
          : null;
        return { ...img, thumbUrl };
      })
    );
  })();

  const feed = withUrls.map((img) => ({
    id: img.id,
    thumbUrl: img.thumbUrl,
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
