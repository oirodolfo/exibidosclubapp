import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@exibidos/db/client";
import { authOptions } from "@/lib/auth/config";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  if (process.env.FEATURE_GROUPS !== "true") {
    return NextResponse.json({ error: "groups_disabled" }, { status: 403 });
  }

  const { slug } = await params;
  const group = await prisma.group.findUnique({
    where: { slug },
    include: {
      category: true,
      members: { include: { user: { select: { id: true, name: true }, include: { slugs: { select: { slug: true }, take: 1 } } } } },
    },
  });

  if (!group) return NextResponse.json({ error: "not_found" }, { status: 404 });

  return NextResponse.json({
    id: group.id,
    name: group.name,
    slug: group.slug,
    description: group.description,
    category: group.category,
    members: group.members.map((m) => ({
      id: m.user.id,
      name: m.user.name,
      slug: m.user.slugs[0]?.slug,
      role: m.role,
    })),
  });
}

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  if (process.env.FEATURE_GROUPS !== "true") {
    return NextResponse.json({ error: "groups_disabled" }, { status: 403 });
  }

  const { slug } = await params;
  const group = await prisma.group.findUnique({ where: { slug } });

  if (!group) return NextResponse.json({ error: "not_found" }, { status: 404 });

  const existing = await prisma.groupMember.findUnique({
    where: { groupId_userId: { groupId: group.id, userId: session.user.id } },
  });

  if (existing) {
    return NextResponse.json({ error: "already_member" }, { status: 409 });
  }

  await prisma.groupMember.create({
    data: { groupId: group.id, userId: session.user.id, role: "member" },
  });

  return NextResponse.json({ ok: true }, { status: 201 });
}
