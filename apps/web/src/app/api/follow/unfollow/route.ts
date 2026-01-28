import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@exibidos/db/client";
import { authOptions } from "@/lib/auth/config";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const u = new URL(req.url);
  const slug = u.searchParams.get("slug");
  if (!slug) return NextResponse.json({ error: "slug_required" }, { status: 400 });

  const slugRow = await prisma.slug.findUnique({ where: { slug }, select: { userId: true } });
  if (!slugRow) return NextResponse.json({ error: "not_found" }, { status: 404 });

  await prisma.follow.deleteMany({
    where: { fromId: session.user.id, toId: slugRow.userId },
  });
  return NextResponse.json({ ok: true }, { status: 200 });
}
