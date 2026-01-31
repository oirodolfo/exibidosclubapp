import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { getServerSession } from "next-auth";
import { prisma } from "@exibidos/db/client";
import { authOptions } from "@/lib/auth/config";
import { page, link } from "@/lib/variants";
import { CategoryFeedClient } from "./_components/CategoryFeedClient";

export default async function CategoryFeedPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    redirect("/auth/login?callbackUrl=/categories");
  }

  const { slug } = await params;
  const category = await prisma.category.findUnique({
    where: { slug },
    select: { id: true, name: true, slug: true },
  });
  if (!category) notFound();

  return (
    <main className={page.default}>
      <div className="mb-4 flex items-center justify-between">
        <Link href={`/categories/${slug}`} className={link}>
          ← {category.name}
        </Link>
      </div>
      <CategoryFeedClient slug={slug} />
    </main>
  );
}
