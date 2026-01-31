/**
 * Categories + tags: long-lived cache (rarely change).
 * Used by ImageDetailClient for tag selection.
 */
import { useQuery } from "@tanstack/react-query";

export type CategoryWithTags = {
  id: string;
  name: string;
  slug: string;
  tags: { id: string; name: string; slug: string }[];
};

async function fetchCategories(): Promise<CategoryWithTags[]> {
  const res = await fetch("/api/categories");
  if (!res.ok) return [];
  const data = (await res.json()) as { categories?: { id: string; name: string; slug: string }[] };
  if (!data.categories?.length) return [];
  const withTags = await Promise.all(
    data.categories.map(async (c) => {
      const tr = await fetch(`/api/categories/${c.slug}/tags`);
      const td = (await tr.json()) as { tags?: { id: string; name: string; slug: string }[] };
      return { ...c, tags: td.tags ?? [] };
    })
  );
  return withTags;
}

export function useCategories() {
  return useQuery({
    queryKey: ["categories"],
    queryFn: fetchCategories,
    staleTime: 10 * 60 * 1000,
  });
}
