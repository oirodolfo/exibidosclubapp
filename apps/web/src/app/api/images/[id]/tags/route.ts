import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { prisma } from "@exibidos/db/client";
import { authOptions } from "@/lib/auth/config";
import { log } from "@/lib/logger";

const PostBody = z.object({ tagId: z.string().min(1) });

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (process.env.FEATURE_TAGGING !== "true") {
    return NextResponse.json({ error: "tagging_disabled" }, { status: 403 });
  }
  const { id } = await params;
  const image = await prisma.image.findUnique({
    where: { id, deletedAt: null },
    include: {
      imageTags: {
        include: { tag: { include: { category: true } } },
      },
    },
  });

  if (!image) return NextResponse.json({ error: "not_found" }, { status: 404 });

  const votes = await prisma.vote.groupBy({
    by: ["tagId"],
    where: { imageId: id, tagId: { not: null } },
    _avg: { weight: true },
    _count: true,
    _sum: { weight: true },
  });

  const voteByTag = Object.fromEntries(
    votes.map((v) => [v.tagId!, { avg: v._avg.weight ?? 0, count: v._count, sum: v._sum.weight ?? 0 }])
  );

  const tags = image.imageTags.map((it) => ({
    ...it.tag,
    source: it.source,
    confidence: it.confidence,
    votes: voteByTag[it.tagId] ?? { avg: 0, count: 0, sum: 0 },
  }));

  return NextResponse.json({ tags });
}

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
  const { tagId } = parse.data;

  const image = await prisma.image.findUnique({ where: { id, deletedAt: null } });

  if (!image) return NextResponse.json({ error: "not_found" }, { status: 404 });

  const tag = await prisma.tag.findUnique({ where: { id: tagId } });

  if (!tag) return NextResponse.json({ error: "tag_not_found" }, { status: 404 });

  const existing = await prisma.imageTag.findUnique({
    where: { imageId_tagId: { imageId: id, tagId } },
  });

  if (existing) {
    log.api.tags.info("tag add: conflict (already tagged)", { imageId: id, tagId });

    return NextResponse.json({ error: "already_tagged" }, { status: 409 });
  }

  await prisma.imageTag.create({
    data: { imageId: id, tagId, source: "user" },
  });

  await prisma.auditLog.create({
    data: {
      actorId: session.user.id,
      action: "image.tag_add",
      entityType: "ImageTag",
      entityId: id,
      meta: { tagId, tagName: tag.name },
    },
  });

  log.api.tags.info("tag add: success", { imageId: id, tagId, tagName: tag.name, userId: session.user.id });

  return NextResponse.json({ ok: true }, { status: 201 });
}
