import { notFound } from "next/navigation";
import Link from "next/link";
import { getServerSession } from "next-auth";
import { prisma } from "@exibidos/db/client";
import { authOptions } from "@/lib/auth/config";

export default async function FollowersPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  if (!slug) notFound();

  const slugRow = await prisma.slug.findFirst({
    where: { slug, user: { deletedAt: null } },
    include: { user: { include: { profile: true } } },
  });
  if (!slugRow) notFound();

  const ownerId = slugRow.userId;
  const profile = slugRow.user.profile;
  const isPrivate = profile?.isPrivate ?? false;

  const session = await getServerSession(authOptions);
  const isOwner = !!session?.user?.id && session.user.id === ownerId;
  let isFollower = false;
  if (session?.user?.id && !isOwner) {
    const f = await prisma.follow.findUnique({ where: { fromId_toId: { fromId: session.user.id, toId: ownerId } }, select: { status: true } });
    isFollower = f?.status === "accepted";
  }
  const canSee = isOwner || isFollower || !isPrivate;
  if (!canSee) {
    return (
      <main style={{ padding: "1rem" }}>
        <p>This list is private.</p>
        <p><Link href={`/${slug}`}>Back to profile</Link></p>
      </main>
    );
  }

  const list = await prisma.follow.findMany({
    where: { toId: ownerId, status: "accepted" },
    include: { from: { include: { profile: true, slugs: true } } },
    orderBy: { createdAt: "desc" },
  });

  return (
    <main style={{ maxWidth: 560, margin: "0 auto", padding: "1rem" }}>
      <h1>Followers</h1>
      <p><Link href={`/${slug}`}>← {slug}</Link></p>
      <ul style={{ listStyle: "none", padding: 0 }}>
        {list.map((f) => {
          const s = f.from.slugs[0]?.slug;
          const name = f.from.profile?.displayName ?? f.from.name ?? s ?? "—";
          return (
            <li key={f.id} style={{ padding: "0.5rem 0", borderBottom: "1px solid #eee" }}>
              {s ? <Link href={`/${s}`}>{name}</Link> : name}
              {s && <span style={{ color: "#666", marginLeft: "0.5rem" }}>@{s}</span>}
            </li>
          );
        })}
      </ul>
      {list.length === 0 && <p>No followers yet.</p>}
    </main>
  );
}
