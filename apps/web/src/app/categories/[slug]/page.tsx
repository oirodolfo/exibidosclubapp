import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@exibidos/db/client";
import { page, link } from "@/lib/variants";
import { CategoryFollowClient } from "./_components/CategoryFollowClient";

export default async function CategoryPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const category = await prisma.category.findUnique({
    where: { slug },
    include: {
      parent: { select: { name: true, slug: true } },
      tags: { orderBy: { name: "asc" }, take: 50 },
    },
  });
  if (!category) notFound();

  return (
    <main className={page.default}>
      <div className="mb-6">
        <Link href="/feed" className={link}>
          ← Feed
        </Link>
      </div>
      <div className="rounded-exibidos-lg border border-white/10 bg-exibidos-surface/95 p-6">
        <h1 className="text-2xl font-bold text-exibidos-ink">{category.name}</h1>
        {category.description && (
          <p className="mt-2 text-exibidos-ink-soft">{category.description}</p>
        )}
        {category.parent && (
          <p className="mt-2 text-sm text-exibidos-muted">
            Parent: <Link href={`/categories/${category.parent.slug}`} className={link}>{category.parent.name}</Link>
          </p>
        )}
        <CategoryFollowClient slug={slug} />
        <div className="mt-4">
          <Link
            href={`/categories/${slug}/feed`}
            className="inline-block rounded-full bg-exibidos-lime px-4 py-2 font-semibold text-exibidos-bg hover:opacity-90"
          >
            View feed
          </Link>
        </div>
        {category.tags.length > 0 && (
          <div className="mt-6">
            <h2 className="text-sm font-semibold text-exibidos-ink-soft">Tags</h2>
            <ul className="mt-2 flex flex-wrap gap-2">
              {category.tags.map((tag) => (
                <li key={tag.id} className="rounded-exibidos-sm bg-white/10 px-3 py-1 text-sm text-exibidos-ink">
                  {tag.name}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </main>
  );
}
