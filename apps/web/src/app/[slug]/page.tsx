import { redirect, notFound } from "next/navigation";
import { getServerSession } from "next-auth";
import { prisma } from "@exibidos/db/client";
import { authOptions } from "@/lib/auth/config";
import { ProfileTabs, type TabId } from "./_components/ProfileTabs";
import { OverviewTab } from "./_components/OverviewTab";
import { PhotosTab } from "./_components/PhotosTab";
import { ActivityTab } from "./_components/ActivityTab";
import { RankingsTab } from "./_components/RankingsTab";
import { BadgesTab } from "./_components/BadgesTab";
import Link from "next/link";

const TABS: TabId[] = ["overview", "photos", "activity", "rankings", "badges"];

function parseTab(t: string | undefined): TabId {
  if (t && TABS.includes(t as TabId)) return t as TabId;
  return "overview";
}

export default async function SlugPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ tab?: string }>;
}) {
  const { slug } = await params;
  const { tab: tabParam } = await searchParams;
  const tab = parseTab(tabParam);

  if (!slug) notFound();

  const slugRow = await prisma.slug.findFirst({
    where: { slug, user: { deletedAt: null } },
    include: { user: { include: { profile: true } } },
  });

  if (!slugRow?.user) {
    const history = await prisma.slugHistory.findFirst({
      where: { oldSlug: slug },
      orderBy: { createdAt: "desc" },
      include: { user: { include: { slugs: true } } },
    });
    if (history?.user?.slugs[0]) redirect(`/${history.user.slugs[0].slug}`);
    notFound();
  }

  const user = slugRow.user;
  const profile = user.profile;
  const session = await getServerSession(authOptions);
  const isOwner = !!session?.user?.id && session.user.id === user.id;

  // Private profile: only owner can see (Stage 5 will add "follower" check)
  if (profile?.isPrivate && !isOwner) {
    return (
      <main style={{ maxWidth: 560, margin: "2rem auto", padding: "0 1rem" }}>
        <h1>exibidos.club/{slug}</h1>
        <p>This profile is private.</p>
        <p>Request to follow to see their content. (Coming in Stage 5)</p>
        <p><Link href="/">Home</Link></p>
      </main>
    );
  }

  // Load dashboard data
  const [uploadsCount, votesCount, likesCount, images, votes, swipes, userBadges] = await Promise.all([
    prisma.image.count({ where: { userId: user.id, deletedAt: null } }),
    prisma.vote.count({ where: { userId: user.id } }),
    prisma.swipe.count({ where: { userId: user.id, direction: "like" } }),
    prisma.image.findMany({
      where: { userId: user.id, deletedAt: null },
      orderBy: { createdAt: "desc" },
      take: 50,
      select: { id: true, caption: true, createdAt: true, moderationStatus: true },
    }),
    prisma.vote.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      take: 25,
      select: { id: true, createdAt: true, imageId: true },
    }),
    prisma.swipe.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      take: 25,
      select: { id: true, createdAt: true, imageId: true, direction: true },
    }),
    prisma.userBadge.findMany({
      where: { userId: user.id },
      include: { badge: true },
      orderBy: { earnedAt: "desc" },
    }),
  ]);

  const activityItems = [
    ...images.map((i) => ({ type: "upload" as const, id: i.id, createdAt: i.createdAt, caption: i.caption })),
    ...votes.map((v) => ({ type: "vote" as const, id: v.id, createdAt: v.createdAt, imageId: v.imageId })),
    ...swipes.map((s) => ({ type: "swipe" as const, id: s.id, createdAt: s.createdAt, imageId: s.imageId, direction: s.direction })),
  ]
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
    .slice(0, 40);

  const counts = { uploads: uploadsCount, votes: votesCount, likes: likesCount };

  const p = profile ?? {
    overviewPublic: true,
    photosPublic: true,
    activityPublic: true,
    rankingsPublic: true,
    badgesPublic: true,
  };

  const overviewVisible = isOwner || p.overviewPublic;
  const photosVisible = isOwner || p.photosPublic;
  const activityVisible = isOwner || p.activityPublic;
  const rankingsVisible = isOwner || p.rankingsPublic;
  const badgesVisible = isOwner || p.badgesPublic;

  const displayName = profile?.displayName ?? user.name ?? slug;

  return (
    <main style={{ maxWidth: 720, margin: "0 auto", padding: "1rem" }}>
      <header style={{ marginBottom: "1.5rem" }}>
        <h1 style={{ margin: 0 }}>{displayName}</h1>
        <p style={{ margin: "0.25rem 0 0", color: "#666" }}>exibidos.club/{slug}</p>
        {isOwner && <p style={{ marginTop: "0.5rem" }}><Link href="/settings">Edit profile &amp; privacy</Link></p>}
      </header>

      <ProfileTabs slug={slug} current={tab} />

      {tab === "overview" && (
        overviewVisible ? (
          <OverviewTab displayName={displayName} bio={profile?.bio ?? null} slug={slug} counts={counts} isOwner={isOwner} />
        ) : (
          <p>This section is private.</p>
        )
      )}

      {tab === "photos" && (
        photosVisible ? (
          <PhotosTab images={images} isOwner={isOwner} />
        ) : (
          <p>This section is private.</p>
        )
      )}

      {tab === "activity" && (
        activityVisible ? (
          <ActivityTab items={activityItems} />
        ) : (
          <p>This section is private.</p>
        )
      )}

      {tab === "rankings" && (
        rankingsVisible ? (
          <RankingsTab />
        ) : (
          <p>This section is private.</p>
        )
      )}

      {tab === "badges" && (
        badgesVisible ? (
          <BadgesTab badges={userBadges.map((ub) => ({ key: ub.badge.key, name: ub.badge.name, description: ub.badge.description, earnedAt: ub.earnedAt }))} />
        ) : (
          <p>This section is private.</p>
        )
      )}
    </main>
  );
}
