import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { prisma } from "@exibidos/db/client";
import { authOptions } from "@/lib/auth/config";

/** Facebook/Instagram-style reaction types (emoji keys). */
export const REACTION_TYPES = ["like", "love", "haha", "wow", "sad", "angry"] as const;
export type ReactionType = (typeof REACTION_TYPES)[number];

const PostBody = z.object({
  type: z.enum(REACTION_TYPES as unknown as [string, ...string[]]),
});

/** GET /api/images/[id]/reactions — counts by type + current user's reaction. */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  const { id: imageId } = await params;

  const image = await prisma.image.findUnique({
    where: { id: imageId, deletedAt: null },
    select: { id: true },
  });
  if (!image) return NextResponse.json({ error: "not_found" }, { status: 404 });

  const [counts, myReaction] = await Promise.all([
    prisma.reaction.groupBy({
      by: ["type"],
      where: { imageId },
      _count: true,
    }),
    session?.user?.id
      ? prisma.reaction.findUnique({
          where: {
            userId_imageId: { userId: session.user.id, imageId },
          },
          select: { type: true },
        })
      : null,
  ]);

  const byType: Record<string, number> = {};
  for (const t of REACTION_TYPES) byType[t] = 0;
  for (const row of counts) byType[row.type] = row._count;
  const total = counts.reduce((s, r) => s + r._count, 0);

  return NextResponse.json({
    byType,
    total,
    myReaction: myReaction?.type ?? null,
  });
}

/** POST /api/images/[id]/reactions — set or change reaction (auth required). */
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
  const { type } = parse.data;

  const reaction = await prisma.reaction.upsert({
    where: {
      userId_imageId: { userId: session.user.id, imageId },
    },
    create: { imageId, userId: session.user.id, type },
    update: { type },
  });

  return NextResponse.json({ type: reaction.type });
}

/** DELETE /api/images/[id]/reactions — remove my reaction (auth required). */
export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const { id: imageId } = await params;
  await prisma.reaction.deleteMany({
    where: { imageId, userId: session.user.id },
  });

  return NextResponse.json({ removed: true });
}
