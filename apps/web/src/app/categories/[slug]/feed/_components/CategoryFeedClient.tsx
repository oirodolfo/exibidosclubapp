"use client";

import { useInfiniteQuery } from "@tanstack/react-query";
import Link from "next/link";
import Image from "next/image";

async function fetchCategoryFeed(slug: string, cursor?: string | null) {
  const url = cursor
    ? `/api/categories/${slug}/feed?cursor=${cursor}`
    : `/api/categories/${slug}/feed`;
  const res = await fetch(url);
  if (!res.ok) throw new Error("Failed to load");
  return res.json() as Promise<{
    feed: { id: string; thumbUrl: string | null; caption: string | null; owner: { slug: string | null } }[];
    nextCursor: string | null;
    hasMore: boolean;
  }>;
}

export function CategoryFeedClient({ slug }: { slug: string }) {
  const { data, isLoading, error, fetchNextPage, hasNextPage, isFetchingNextPage } =
    useInfiniteQuery({
      queryKey: ["categoryFeed", slug],
      queryFn: ({ pageParam }) => fetchCategoryFeed(slug, pageParam),
      initialPageParam: null as string | null,
      getNextPageParam: (last) => (last.hasMore ? last.nextCursor : undefined),
    });

  const items = data?.pages.flatMap((p) => p.feed) ?? [];

  if (isLoading) return <p className="text-exibidos-muted py-8">Loading...</p>;
  if (error) return <p className="text-exibidos-magenta py-4">{String(error)}</p>;
  if (items.length === 0)
    return (
      <p className="text-exibidos-muted py-8">No images in this category yet.</p>
    );

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
      {items.map((img) => (
        <Link
          key={img.id}
          href={`/feed/vertical`}
          className="block aspect-square overflow-hidden rounded-exibidos-md bg-exibidos-surface"
        >
          {img.thumbUrl ? (
            <div className="relative h-full w-full">
              <Image
                src={img.thumbUrl}
                alt={img.caption ?? ""}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 50vw, 33vw"
                unoptimized
              />
            </div>
          ) : (
            <div className="flex h-full w-full items-center justify-center text-exibidos-muted">
              [img]
            </div>
          )}
        </Link>
      ))}
      {hasNextPage && (
        <button
          type="button"
          onClick={() => fetchNextPage()}
          disabled={isFetchingNextPage}
          className="col-span-full rounded-exibidos-md border border-white/20 py-4 text-exibidos-ink-soft hover:bg-white/5 disabled:opacity-50"
        >
          {isFetchingNextPage ? "Loading..." : "Load more"}
        </button>
      )}
    </div>
  );
}
