import { NextResponse } from "next/server";
import { prisma } from "@exibidos/db/client";

export async function GET() {
  if (process.env.FEATURE_GROUPS !== "true") {
    return NextResponse.json({ error: "groups_disabled" }, { status: 403 });
  }

  const groups = await prisma.group.findMany({
    orderBy: { name: "asc" },
    include: { category: { select: { name: true, slug: true } } },
  });

  return NextResponse.json({
    groups: groups.map((g) => ({
      id: g.id,
      name: g.name,
      slug: g.slug,
      description: g.description,
      category: g.category,
    })),
  });
}
