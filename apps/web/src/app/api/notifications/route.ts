import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@exibidos/db/client";
import { authOptions } from "@/lib/auth/config";

const PAGE_SIZE = 20;

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const cursor = searchParams.get("cursor");
  const limit = Math.min(Number(searchParams.get("limit")) || PAGE_SIZE, 50);

  const notifications = await prisma.notification.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
    take: limit + 1,
    ...(cursor && { cursor: { id: cursor }, skip: 1 }),
  });

  const hasMore = notifications.length > limit;
  const items = hasMore ? notifications.slice(0, limit) : notifications;
  const nextCursor = hasMore ? items[items.length - 1]?.id : null;

  return NextResponse.json({
    notifications: items.map((n) => ({
      id: n.id,
      type: n.type,
      entityType: n.entityType,
      entityId: n.entityId,
      meta: n.meta,
      readAt: n.readAt,
      createdAt: n.createdAt,
    })),
    nextCursor,
    hasMore,
  });
}
