import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { prisma } from "@exibidos/db/client";
import { authOptions } from "@/lib/auth/config";
import { log } from "@/lib/logger";
import { updateImageRankingScore } from "@/lib/rankings";
import { createNotification } from "@/lib/notifications";
import { awardXp } from "@/lib/xp";

const PostBody = z.object({
  tagId: z.string().min(1),
  weight: z.number().int().min(-1).max(5),
});

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  if (process.env.FEATURE_TAGGING !== "true") {
    return NextResponse.json({ error: "tagging_disabled" }, { status: 403 });
  }
  const { id } = await params;
  const parse = PostBody.safeParse(await req.json());
  if (!parse.success) return NextResponse.json({ error: "validation_failed" }, { status: 400 });
  const { tagId, weight } = parse.data;

  const image = await prisma.image.findUnique({
    where: { id, deletedAt: null },
    select: { id: true, userId: true },
  });
  if (!image) return NextResponse.json({ error: "not_found" }, { status: 404 });

  const tag = await prisma.tag.findUnique({ where: { id: tagId }, select: { id: true, categoryId: true } });
  if (!tag) return NextResponse.json({ error: "tag_not_found" }, { status: 404 });

  const prev = await prisma.vote.findUnique({
    where: {
      userId_imageId_tagId: {
        userId: session.user.id,
        imageId: id,
        tagId,
      },
    },
  });

  // One vote per user per category per image: remove other votes in same category for this user+image
  const otherTagsInCategory = await prisma.tag.findMany({
    where: { categoryId: tag.categoryId, id: { not: tagId } },
    select: { id: true },
  });
  const otherTagIds = otherTagsInCategory.map((t) => t.id);
  if (otherTagIds.length > 0) {
    await prisma.vote.deleteMany({
      where: {
        userId: session.user.id,
        imageId: id,
        tagId: { in: otherTagIds },
      },
    });
  }

  const vote = await prisma.vote.upsert({
    where: {
      userId_imageId_tagId: {
        userId: session.user.id,
        imageId: id,
        tagId,
      },
    },
    create: { userId: session.user.id, imageId: id, tagId, weight },
    update: { weight },
  });

  updateImageRankingScore(id).catch(() => {});

  createNotification(image.userId, "category_vote", "Vote", vote.id, {
      actorId: session.user.id,
      imageId: id,
      tagId,
    }).catch(() => {});
  }
  awardXp(session.user.id, 2).catch(() => {});

  await prisma.auditLog.create({
    data: {
      actorId: session.user.id,
      action: "image.vote",
      entityType: "Vote",
      entityId: id,
      meta: { tagId, weight, previousWeight: prev?.weight ?? null },
    },
  });

  log.api.votes.info("vote: success", { imageId: id, tagId, weight, userId: session.user.id });
  return NextResponse.json({ ok: true }, { status: 200 });
}
