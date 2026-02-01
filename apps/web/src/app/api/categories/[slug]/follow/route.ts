import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@exibidos/db/client";
import { authOptions } from "@/lib/auth/config";

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const { slug } = await params;
  const category = await prisma.category.findUnique({
    where: { slug },
    select: { id: true },
  });
  if (!category) return NextResponse.json({ error: "not_found" }, { status: 404 });

  await prisma.categoryFollow.upsert({
    where: {
      userId_categoryId: {
        userId: session.user.id,
        categoryId: category.id,
      },
    },
    create: { userId: session.user.id, categoryId: category.id },
    update: {},
  });

  return NextResponse.json({ ok: true });
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const { slug } = await params;
  const category = await prisma.category.findUnique({
    where: { slug },
    select: { id: true },
  });
  if (!category) return NextResponse.json({ error: "not_found" }, { status: 404 });

  await prisma.categoryFollow.deleteMany({
    where: {
      userId: session.user.id,
      categoryId: category.id,
    },
  });

  return NextResponse.json({ ok: true });
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ following: false });
  }

  const { slug } = await params;
  const category = await prisma.category.findUnique({
    where: { slug },
    select: { id: true },
  });
  if (!category) return NextResponse.json({ error: "not_found" }, { status: 404 });

  const follow = await prisma.categoryFollow.findUnique({
    where: {
      userId_categoryId: {
        userId: session.user.id,
        categoryId: category.id,
      },
    },
  });

  return NextResponse.json({ following: !!follow });
}
