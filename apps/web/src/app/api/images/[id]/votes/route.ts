import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { prisma } from "@exibidos/db/client";
import { authOptions } from "@/lib/auth/config";
import { log } from "@/lib/logger";

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

  const image = await prisma.image.findUnique({ where: { id, deletedAt: null } });

  if (!image) return NextResponse.json({ error: "not_found" }, { status: 404 });

  const tag = await prisma.tag.findUnique({ where: { id: tagId } });

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

  await prisma.vote.upsert({
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
