import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { prisma } from "@exibidos/db/client";
import { authOptions } from "@/lib/auth/config";

const PostBody = z.object({ slug: z.string().min(1).max(30) });

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const parse = PostBody.safeParse(await req.json());
  if (!parse.success) return NextResponse.json({ error: "validation_failed" }, { status: 400 });
  const { slug } = parse.data;

  const toSlug = await prisma.slug.findUnique({ where: { slug }, include: { user: { include: { profile: true } } } });
  if (!toSlug) return NextResponse.json({ error: "not_found" }, { status: 404 });
  const toId = toSlug.userId;
  const fromId = session.user.id;

  if (fromId === toId) return NextResponse.json({ error: "cannot_follow_self" }, { status: 400 });

  const blocked = await prisma.block.findUnique({ where: { blockerId_blockedId: { blockerId: toId, blockedId: fromId } } });
  if (blocked) return NextResponse.json({ error: "blocked" }, { status: 403 });

  const existing = await prisma.follow.findUnique({ where: { fromId_toId: { fromId, toId } } });
  if (existing) {
    if (existing.status === "accepted") return NextResponse.json({ status: "accepted" }, { status: 200 });
    if (existing.status === "pending") return NextResponse.json({ status: "pending" }, { status: 200 });
    if (existing.status === "blocked") return NextResponse.json({ error: "blocked" }, { status: 403 });
  }

  const profile = toSlug.user.profile;
  const isPrivate = profile?.isPrivate ?? false;
  const acceptAlways = profile?.acceptFollowRequestsAlways ?? true;

  const status = !isPrivate || acceptAlways ? "accepted" : "pending";

  await prisma.follow.upsert({
    where: { fromId_toId: { fromId, toId } },
    create: { fromId, toId, status },
    update: { status },
  });

  return NextResponse.json({ status }, { status: 201 });
}
