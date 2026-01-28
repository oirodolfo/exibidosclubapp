import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@exibidos/db/client";
import { authOptions } from "@/lib/auth/config";

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ status: "none" as const }, { status: 200 });

  const u = new URL(req.url);
  const slug = u.searchParams.get("slug");
  if (!slug) return NextResponse.json({ error: "slug_required" }, { status: 400 });

  const slugRow = await prisma.slug.findUnique({ where: { slug }, select: { userId: true } });
  if (!slugRow) return NextResponse.json({ error: "not_found" }, { status: 404 });

  const f = await prisma.follow.findUnique({
    where: { fromId_toId: { fromId: session.user.id, toId: slugRow.userId } },
    select: { status: true },
  });
  if (!f) return NextResponse.json({ status: "none" as const }, { status: 200 });
  if (f.status === "accepted") return NextResponse.json({ status: "accepted" as const }, { status: 200 });
  if (f.status === "pending") return NextResponse.json({ status: "pending" as const }, { status: 200 });
  return NextResponse.json({ status: "none" as const }, { status: 200 });
}
