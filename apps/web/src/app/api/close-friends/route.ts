import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { prisma } from "@exibidos/db/client";
import { authOptions } from "@/lib/auth/config";

const PostBody = z.object({ slug: z.string().min(1).max(30) });

export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const list = await prisma.closeFriend.findMany({
    where: { userId: session.user.id },
    include: { target: { include: { profile: true, slugs: true } } },
    orderBy: { createdAt: "desc" },
  });

  const items = list.map((cf) => ({
    slug: cf.target.slugs[0]?.slug ?? null,
    displayName: cf.target.profile?.displayName ?? cf.target.name ?? null,
  }));

  return NextResponse.json({ closeFriends: items }, { status: 200 });
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const parse = PostBody.safeParse(await req.json());

  if (!parse.success) return NextResponse.json({ error: "validation_failed" }, { status: 400 });
  const { slug } = parse.data;

  const slugRow = await prisma.slug.findUnique({ where: { slug }, select: { userId: true } });

  if (!slugRow) return NextResponse.json({ error: "not_found" }, { status: 404 });

  const targetId = slugRow.userId;

  if (targetId === session.user.id) return NextResponse.json({ error: "cannot_add_self" }, { status: 400 });

  await prisma.closeFriend.upsert({
    where: { userId_targetId: { userId: session.user.id, targetId } },
    create: { userId: session.user.id, targetId },
    update: {},
  });

  return NextResponse.json({ ok: true }, { status: 201 });
}
