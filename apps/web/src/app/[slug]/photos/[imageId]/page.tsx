import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { getServerSession } from "next-auth";
import { prisma } from "@exibidos/db/client";
import { authOptions } from "@/lib/auth/config";
import { getSignedDownloadUrl, isStorageConfigured } from "@/lib/storage";
import { page, link } from "@/lib/variants";
import { ImageDetailClient } from "./_components/ImageDetailClient";

export default async function ImageDetailPage({
  params,
}: {
  params: Promise<{ slug: string; imageId: string }>;
}) {
  const { slug, imageId } = await params;

  const slugRow = await prisma.slug.findFirst({
    where: { slug, user: { deletedAt: null } },
    include: { user: { include: { profile: true } } },
  });
  if (!slugRow?.user) notFound();

  const user = slugRow.user;
  const profile = user.profile;
  const session = await getServerSession(authOptions);
  const isOwner = !!session?.user?.id && session.user.id === user.id;

  let isFollower = false;
  if (session?.user?.id && !isOwner) {
    const f = await prisma.follow.findUnique({
      where: { fromId_toId: { fromId: session.user.id, toId: user.id } },
      select: { status: true },
    });
    isFollower = f?.status === "accepted";
  }

  const p = profile ?? {
    overviewPublic: true,
    photosPublic: true,
    activityPublic: true,
    rankingsPublic: true,
    badgesPublic: true,
  };
  const photosVisible = isOwner || p.photosPublic;
  if (!photosVisible && (profile?.isPrivate ?? false) && !isFollower) notFound();

  const image = await prisma.image.findFirst({
    where: { id: imageId, userId: user.id, deletedAt: null },
    include: {
      imageTags: { include: { tag: { include: { category: true } } } },
    },
  });
  if (!image) notFound();

  let thumbUrl: string | null = null;
  if (isStorageConfigured() && image.thumbKey) {
    try {
      thumbUrl = await getSignedDownloadUrl(image.thumbKey, 3600);
    } catch {
      thumbUrl = null;
    }
  }

  const tags = image.imageTags.map((it) => ({
    id: it.tagId,
    name: it.tag.name,
    slug: it.tag.slug,
    category: it.tag.category.name,
    source: it.source,
    confidence: it.confidence,
  }));

  const votes = await prisma.vote.groupBy({
    by: ["tagId"],
    where: { imageId, tagId: { not: null } },
    _avg: { weight: true },
    _count: true,
  });
  const voteByTag = Object.fromEntries(
    votes.map((v) => [v.tagId!, { avg: v._avg.weight ?? 0, count: v._count }])
  );

  const displayName = profile?.displayName ?? user.name ?? slug;
  const taggingEnabled = process.env.FEATURE_TAGGING === "true";

  return (
    <main className={page.wide}>
      <p className="mb-4">
        <Link href={`/${slug}?tab=photos`} className={link}>
          ← {displayName}
        </Link>
      </p>
      <div className="flex flex-col gap-6 md:flex-row">
        <div className="flex-shrink-0">
          <div className="aspect-square max-w-md rounded-lg overflow-hidden bg-neutral-200 relative">
            {thumbUrl ? (
              <Image src={thumbUrl} alt={image.caption ?? "Photo"} fill className="object-contain" sizes="(max-width: 768px) 100vw, 28rem" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-neutral-400">[img]</div>
            )}
          </div>
          {image.caption && <p className="mt-2">{image.caption}</p>}
          <p className="text-sm text-neutral-500">{new Date(image.createdAt).toLocaleDateString()}</p>
        </div>
        <div className="flex-1">
          <h2 className="text-lg font-medium mb-2">Tags</h2>
          {taggingEnabled ? (
            <ImageDetailClient
              imageId={imageId}
              tags={tags}
              voteByTag={voteByTag}
              slug={slug}
            />
          ) : (
            <p className="text-neutral-500">Tagging is disabled.</p>
          )}
        </div>
      </div>
    </main>
  );
}
