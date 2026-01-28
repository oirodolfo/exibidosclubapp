import { notFound } from "next/navigation";
import Link from "next/link";
import { getServerSession } from "next-auth";
import { prisma } from "@exibidos/db/client";
import { authOptions } from "@/lib/auth/config";
import { link, listReset, listItemBordered, page, slugHandle, mainBlock } from "@/lib/variants";

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
      <main className={mainBlock}>
        <p>This list is private.</p>
        <p><Link href={`/${slug}`} className={link}>Back to profile</Link></p>
      </main>
    );
  }

  const list = await prisma.follow.findMany({
    where: { toId: ownerId, status: "accepted" },
    include: { from: { include: { profile: true, slugs: true } } },
    orderBy: { createdAt: "desc" },
  });

  return (
    <main className={page.mid}>
      <h1>Followers</h1>
      <p><Link href={`/${slug}`} className={link}>← {slug}</Link></p>
      <ul className={listReset}>
        {list.map((f) => {
          const s = f.from.slugs[0]?.slug;
          const name = f.from.profile?.displayName ?? f.from.name ?? s ?? "—";
          return (
            <li key={f.id} className={listItemBordered}>
              {s ? <Link href={`/${s}`} className={link}>{name}</Link> : name}
              {s && <span className={slugHandle}>@{s}</span>}
            </li>
          );
        })}
      </ul>
      {list.length === 0 && <p>No followers yet.</p>}
    </main>
  );
}
