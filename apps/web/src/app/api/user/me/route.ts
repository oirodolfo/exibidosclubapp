import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@exibidos/db/client";
import { authOptions } from "@/lib/auth/config";

export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const slugRow = await prisma.slug.findUnique({
    where: { userId: session.user.id },
    select: { slug: true },
  });

  return NextResponse.json({ id: session.user.id, slug: slugRow?.slug ?? null });
}
