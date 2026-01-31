import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { prisma } from "@exibidos/db/client";
import { authOptions } from "@/lib/auth/config";
import { log } from "@/lib/logger";
import { updateImageRankingScore } from "@/lib/rankings";
import { createNotification } from "@/lib/notifications";

/** Request body schema: imageId, direction (like|dislike|skip), optional categoryId when like. */
const PostBody = z.object({
  imageId: z.string().min(1),
  direction: z.enum(["like", "dislike", "skip"]),
  categoryId: z.string().optional(),
});

/**
 * Record a swipe (like/dislike/skip) for an image.
 * Category is required when direction is "like". Duplicate swipes return 409.
 */
export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  if (process.env.FEATURE_SWIPE !== "true") {
    return NextResponse.json({ error: "swipe_disabled" }, { status: 403 });
  }

  const parse = PostBody.safeParse(await req.json());
  if (!parse.success) {
    return NextResponse.json({ error: "validation_failed" }, { status: 400 });
  }
  const { imageId, direction, categoryId } = parse.data;

  if (direction === "like" && categoryId) {
    const cat = await prisma.category.findUnique({ where: { id: categoryId } });
    if (!cat) {
      return NextResponse.json({ error: "category_not_found" }, { status: 404 });
    }
  }

  const image = await prisma.image.findUnique({
    where: { id: imageId, deletedAt: null },
    select: { id: true, userId: true },
  });
  if (!image) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  const existing = await prisma.swipe.findFirst({
    where: { userId: session.user.id, imageId },
  });
  if (existing) {
    log.api.swipe.info("swipe: duplicate rejected", { imageId, userId: session.user.id });
    return NextResponse.json({ error: "already_swiped" }, { status: 409 });
  }

  const swipe = await prisma.swipe.create({
    data: {
      userId: session.user.id,
      imageId,
      direction,
      categoryId: direction === "like" ? categoryId ?? null : null,
    },
  });

  if (direction === "like") {
    updateImageRankingScore(imageId).catch(() => {});
    createNotification(image.userId, "feed_like", "Swipe", swipe.id, {
      actorId: session.user.id,
      imageId,
    }).catch(() => {});
  }

  log.api.swipe.info("swipe: success", {
    imageId,
    direction,
    categoryId: direction === "like" ? categoryId : null,
    userId: session.user.id,
  });
  return NextResponse.json({ ok: true }, { status: 201 });
}
