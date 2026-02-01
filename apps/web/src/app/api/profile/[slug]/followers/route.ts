import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@exibidos/db/client";
import { authOptions } from "@/lib/auth/config";

export async function GET(_req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  if (!slug) return NextResponse.json({ error: "not_found" }, { status: 404 });

  const slugRow = await prisma.slug.findFirst({
    where: { slug, user: { deletedAt: null } },
    include: { user: { include: { profile: true } } },
  });

  if (!slugRow) return NextResponse.json({ error: "not_found" }, { status: 404 });

  const ownerId = slugRow.userId;
  const profile = slugRow.user.profile;
  const isPrivate = profile?.isPrivate ?? false;

  const session = await getServerSession(authOptions);
  const isOwner = !!session?.user?.id && session.user.id === ownerId;

  let isFollower = false;

  if (session?.user?.id && !isOwner) {
    const f = await prisma.follow.findUnique({
      where: { fromId_toId: { fromId: session.user.id, toId: ownerId } },
      select: { status: true },
    });

    isFollower = f?.status === "accepted";
  }

  const canSee = isOwner || isFollower || !isPrivate;

  if (!canSee) return NextResponse.json({ error: "private" }, { status: 403 });

  const list = await prisma.follow.findMany({
    where: { toId: ownerId, status: "accepted" },
    include: { from: { include: { profile: true, slugs: true } } },
    orderBy: { createdAt: "desc" },
  });

  const items = list.map((f) => ({
    slug: f.from.slugs[0]?.slug ?? null,
    displayName: f.from.profile?.displayName ?? f.from.name ?? null,
  }));

  return NextResponse.json({ followers: items }, { status: 200 });
}
