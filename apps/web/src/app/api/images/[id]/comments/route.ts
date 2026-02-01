import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { prisma } from "@exibidos/db/client";
import { authOptions } from "@/lib/auth/config";

const MAX_BODY_LENGTH = 2000;
const PostBody = z.object({ body: z.string().min(1).max(MAX_BODY_LENGTH).trim() });

/** GET /api/images/[id]/comments — list comments for an image (newest first). */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: imageId } = await params;
  const image = await prisma.image.findUnique({
    where: { id: imageId, deletedAt: null },
    select: { id: true },
  });

  if (!image) return NextResponse.json({ error: "not_found" }, { status: 404 });

  const comments = await prisma.comment.findMany({
    where: { imageId, deletedAt: null },
    orderBy: { createdAt: "asc" },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          slugs: { take: 1, select: { slug: true } },
        },
      },
    },
  });

  const list = comments.map((c) => ({
    id: c.id,
    body: c.body,
    createdAt: c.createdAt.toISOString(),
    user: {
      id: c.user.id,
      name: c.user.name,
      slug: c.user.slugs[0]?.slug ?? null,
    },
  }));

  return NextResponse.json({ comments: list });
}

/** POST /api/images/[id]/comments — add a comment (auth required). */
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const { id: imageId } = await params;
  const image = await prisma.image.findUnique({
    where: { id: imageId, deletedAt: null },
    select: { id: true },
  });

  if (!image) return NextResponse.json({ error: "not_found" }, { status: 404 });

  const parse = PostBody.safeParse(await req.json());

  if (!parse.success) {
    return NextResponse.json({ error: "validation_failed" }, { status: 400 });
  }
  const { body } = parse.data;

  const comment = await prisma.comment.create({
    data: { imageId, userId: session.user.id, body },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          slugs: { take: 1, select: { slug: true } },
        },
      },
    },
  });

  return NextResponse.json({
    id: comment.id,
    body: comment.body,
    createdAt: comment.createdAt.toISOString(),
    user: {
      id: comment.user.id,
      name: comment.user.name,
      slug: comment.user.slugs[0]?.slug ?? null,
    },
  });
}
