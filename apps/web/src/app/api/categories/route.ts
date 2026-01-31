import { NextResponse } from "next/server";
import { prisma } from "@exibidos/db/client";

export async function GET() {
  if (process.env.FEATURE_TAGGING !== "true") {
    return NextResponse.json({ error: "tagging_disabled" }, { status: 403 });
  }
  const categories = await prisma.category.findMany({
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    include: {
      parent: { select: { id: true, name: true, slug: true } },
      _count: { select: { tags: true } },
    },
  });
  return NextResponse.json({ categories });
}
