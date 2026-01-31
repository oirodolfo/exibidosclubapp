import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { prisma } from "@exibidos/db/client";
import { authOptions } from "@/lib/auth/config";
import { updateImageRankingScore } from "@/lib/rankings";
import { createNotification } from "@/lib/notifications";

const PostBody = z.object({ body: z.string().min(1).max(2000) });

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const image = await prisma.image.findUnique({
    where: { id, deletedAt: null },
    select: { id: true },
  });
  if (!image) return NextResponse.json({ error: "not_found" }, { status: 404 });

  const comments = await prisma.comment.findMany({
    where: { imageId: id, deletedAt: null },
    orderBy: { createdAt: "asc" },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          image: true,
          slugs: { select: { slug: true }, take: 1 },
        },
      },
    },
  });

  const list = comments.map((c) => ({
    id: c.id,
    body: c.body,
    createdAt: c.createdAt,
    user: {
      id: c.user.id,
      name: c.user.name,
      image: c.user.image,
      slug: c.user.slugs[0]?.slug ?? null,
    },
  }));

  return NextResponse.json({ comments: list });
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const image = await prisma.image.findUnique({
    where: { id, deletedAt: null },
    select: { id: true },
  });
  if (!image) return NextResponse.json({ error: "not_found" }, { status: 404 });

  const parsed = PostBody.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_body" }, { status: 400 });
  }

  const comment = await prisma.comment.create({
    data: {
      imageId: id,
      userId: session.user.id,
      body: parsed.data.body,
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          image: true,
          slugs: { select: { slug: true }, take: 1 },
        },
      },
    },
  });

  updateImageRankingScore(id).catch(() => {});

  const image = await prisma.image.findUnique({
    where: { id },
    select: { userId: true },
  });
  if (image) {
    createNotification(image.userId, "feed_comment", "Comment", comment.id, {
      actorId: session.user.id,
      imageId: id,
    }).catch(() => {});
  }

  return NextResponse.json({
    id: comment.id,
    body: comment.body,
    createdAt: comment.createdAt,
    user: {
      id: comment.user.id,
      name: comment.user.name,
      image: comment.user.image,
      slug: comment.user.slugs[0]?.slug ?? null,
    },
  });
}
