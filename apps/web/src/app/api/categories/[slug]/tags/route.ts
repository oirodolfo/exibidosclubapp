import { NextResponse } from "next/server";
import { prisma } from "@exibidos/db/client";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  if (process.env.FEATURE_TAGGING !== "true") {
    return NextResponse.json({ error: "tagging_disabled" }, { status: 403 });
  }
  const { slug } = await params;
  const category = await prisma.category.findUnique({
    where: { slug },
    include: { tags: { orderBy: { name: "asc" } } },
  });

  if (!category) return NextResponse.json({ error: "not_found" }, { status: 404 });

  return NextResponse.json({ category, tags: category.tags });
}
