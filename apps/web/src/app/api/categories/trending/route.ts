import { NextResponse } from "next/server";
import { prisma } from "@exibidos/db/client";

export async function GET() {
  const swipesByCategory = await prisma.swipe.groupBy({
    by: ["categoryId"],
    where: {
      categoryId: { not: null },
      direction: "like",
    },
    _count: { id: true },
    orderBy: { _count: { id: "desc" } },
    take: 20,
  });

  const categoryIds = swipesByCategory.map((s) => s.categoryId).filter(Boolean) as string[];
  if (categoryIds.length === 0) {
    return NextResponse.json({ categories: [] });
  }

  const categories = await prisma.category.findMany({
    where: { id: { in: categoryIds } },
    select: { id: true, name: true, slug: true, description: true },
  });

  const countByCategoryId = Object.fromEntries(
    swipesByCategory.map((s) => [s.categoryId!, s._count.id])
  );

  const list = categories.map((c) => ({
    ...c,
    likeCount: countByCategoryId[c.id] ?? 0,
  })).sort((a, b) => b.likeCount - a.likeCount);

  return NextResponse.json({ categories: list });
}
