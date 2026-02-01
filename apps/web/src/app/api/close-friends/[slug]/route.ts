import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@exibidos/db/client";
import { authOptions } from "@/lib/auth/config";

export async function DELETE(_req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { slug } = await params;
  const slugRow = await prisma.slug.findUnique({ where: { slug }, select: { userId: true } });

  if (!slugRow) return NextResponse.json({ error: "not_found" }, { status: 404 });

  await prisma.closeFriend.deleteMany({
    where: { userId: session.user.id, targetId: slugRow.userId },
  });

  return NextResponse.json({ ok: true }, { status: 200 });
}
