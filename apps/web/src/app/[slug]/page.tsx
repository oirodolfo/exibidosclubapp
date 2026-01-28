import { redirect, notFound } from "next/navigation";
import { prisma } from "@exibidos/db/client";

/** exibidos.club/{slug} — resolve slug (or slug history) and show profile. */
export default async function SlugPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  if (!slug) notFound();

  const slugRow = await prisma.slug.findFirst({
    where: { slug, user: { deletedAt: null } },
    include: { user: { include: { profile: true } } },
  });

  if (slugRow?.user) {
    return (
      <main style={{ padding: "1rem" }}>
        <h1>{slugRow.user.profile?.displayName ?? slugRow.user.name ?? slug}</h1>
        <p>exibidos.club/{slug}</p>
        {/* Stage 4 will add full profile UI */}
      </main>
    );
  }

  const history = await prisma.slugHistory.findFirst({
    where: { oldSlug: slug },
    orderBy: { createdAt: "desc" },
    include: { user: { include: { slugs: true } } },
  });
  if (history?.user?.slugs[0]) {
    redirect(`/${history.user.slugs[0].slug}`);
  }

  notFound();
}
