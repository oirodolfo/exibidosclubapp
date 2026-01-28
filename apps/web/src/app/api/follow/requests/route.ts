import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@exibidos/db/client";
import { authOptions } from "@/lib/auth/config";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const list = await prisma.follow.findMany({
    where: { toId: session.user.id, status: "pending" },
    include: { from: { include: { profile: true, slugs: true } } },
    orderBy: { createdAt: "desc" },
  });

  const items = list.map((f) => ({
    fromId: f.fromId,
    slug: f.from.slugs[0]?.slug ?? null,
    displayName: f.from.profile?.displayName ?? f.from.name ?? null,
    createdAt: f.createdAt,
  }));

  return NextResponse.json({ requests: items }, { status: 200 });
}
