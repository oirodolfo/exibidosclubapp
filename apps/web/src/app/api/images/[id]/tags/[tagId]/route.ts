import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@exibidos/db/client";
import { authOptions } from "@/lib/auth/config";
import { log } from "@/lib/logger";

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string; tagId: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  if (process.env.FEATURE_TAGGING !== "true") {
    return NextResponse.json({ error: "tagging_disabled" }, { status: 403 });
  }
  const { id, tagId } = await params;

  const it = await prisma.imageTag.findUnique({
    where: { imageId_tagId: { imageId: id, tagId } },
    include: { tag: true },
  });
  if (!it) return NextResponse.json({ error: "not_found" }, { status: 404 });

  await prisma.imageTag.delete({
    where: { imageId_tagId: { imageId: id, tagId } },
  });

  await prisma.auditLog.create({
    data: {
      actorId: session.user.id,
      action: "image.tag_remove",
      entityType: "ImageTag",
      entityId: id,
      meta: { tagId, tagName: it.tag.name },
    },
  });

  log.api.tags.info("tag remove: success", { imageId: id, tagId, userId: session.user.id });
  return NextResponse.json({ ok: true });
}
