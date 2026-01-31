/**
 * Swipe feed: infinite query with cursor pagination.
 * useSwipeFeed: pages of FeedItem[]; useSwipeMutation invalidates on success.
 */
import { useInfiniteQuery, useMutation, useQueryClient } from "@tanstack/react-query";

export type FeedItem = {
  id: string;
  thumbUrl: string | null;
  caption: string | null;
  createdAt: string;
  owner: { id: string; name: string | null; slug: string | null };
};

async function fetchFeed(cursor?: string | null) {
  const url = cursor ? `/api/swipe/feed?cursor=${cursor}` : "/api/swipe/feed";
  const res = await fetch(url);
  if (!res.ok) {
    const d = (await res.json().catch(() => ({}))) as { error?: string };
    throw new Error(d.error ?? "Failed to load");
  }
  return res.json() as Promise<{ feed: FeedItem[]; nextCursor: string | null }>;
}

export function useSwipeFeed() {
  return useInfiniteQuery({
    queryKey: ["swipe", "feed"],
    queryFn: ({ pageParam }) => fetchFeed(pageParam),
    initialPageParam: null as string | null,
    getNextPageParam: (last) => last.nextCursor ?? undefined,
  });
}

export function useSwipeMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ imageId, direction }: { imageId: string; direction: "like" | "dislike" | "skip" }) => {
      const res = await fetch("/api/swipe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageId, direction }),
      });
      if (!res.ok) {
        const d = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(d.error ?? "Failed");
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["swipe"] }),
  });
}
