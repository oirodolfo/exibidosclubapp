"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { link } from "@/lib/variants";

type FeedItem = {
  id: string;
  thumbUrl: string | null;
  caption: string | null;
  createdAt: string;
  owner: { id: string; name: string | null; slug: string | null };
};

export function SwipeFeed() {
  const [items, setItems] = useState<FeedItem[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [swiping, setSwiping] = useState(false);

  const fetchFeed = useCallback(async (cursor?: string | null) => {
    const url = cursor ? `/api/swipe/feed?cursor=${cursor}` : "/api/swipe/feed";
    const res = await fetch(url);
    if (!res.ok) {
      const d = (await res.json().catch(() => ({}))) as { error?: string };
      throw new Error(d.error ?? "Failed to load");
    }
    const data = (await res.json()) as { feed: FeedItem[]; nextCursor: string | null };
    return data;
  }, []);

  useEffect(() => {
    fetchFeed()
      .then(({ feed, nextCursor: nc }) => {
        setItems(feed);
        setNextCursor(nc);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [fetchFeed]);

  const loadMore = useCallback(async () => {
    if (!nextCursor || items.length === 0) return;
    try {
      const { feed, nextCursor: nc } = await fetchFeed(nextCursor);
      setItems((prev) => [...prev, ...feed]);
      setNextCursor(nc);
    } catch {
      // ignore
    }
  }, [nextCursor, items.length, fetchFeed]);

  const swipe = useCallback(
    async (direction: "like" | "dislike" | "skip") => {
      const item = items[currentIndex];
      if (!item || swiping) return;

      setSwiping(true);
      try {
        const res = await fetch("/api/swipe", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ imageId: item.id, direction }),
        });
        if (!res.ok) {
          const d = (await res.json().catch(() => ({}))) as { error?: string };
          throw new Error(d.error ?? "Failed");
        }
        if (currentIndex >= items.length - 3 && nextCursor) {
          loadMore();
        }
        setCurrentIndex((i) => i + 1);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Swipe failed");
      } finally {
        setSwiping(false);
      }
    },
    [items, currentIndex, swiping, nextCursor, loadMore]
  );

  if (loading) {
    return <p className="text-neutral-500 py-8">Loading...</p>;
  }
  if (error) {
    return (
      <p className="text-red-600 py-4">
        {error}{" "}
        <button type="button" onClick={() => window.location.reload()} className={link}>
          Retry
        </button>
      </p>
    );
  }
  if (items.length === 0) {
    return (
      <div className="py-12 text-center">
        <p className="text-neutral-500">No images to swipe. Check back later!</p>
        <p className="mt-4">
          <Link href="/" className={link}>Explore profiles</Link>
        </p>
      </div>
    );
  }

  const item = items[currentIndex];
  if (!item) {
    return (
      <div className="py-12 text-center">
        <p className="text-neutral-500">You&apos;ve seen everything for now.</p>
        <p className="mt-4">
          <Link href="/" className={link}>Explore profiles</Link>
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-6">
      <div
        className="relative w-full max-w-[400px] aspect-square rounded-xl overflow-hidden bg-neutral-200 shadow-lg"
        role="img"
        aria-label={item.caption ?? "Photo"}
      >
        {item.thumbUrl ? (
          <img
            src={item.thumbUrl}
            alt={item.caption ?? ""}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-neutral-400">
            [img]
          </div>
        )}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-4 text-white">
          {item.caption && <p className="m-0 text-sm">{item.caption}</p>}
          {item.owner.slug && (
            <Link
              href={`/${item.owner.slug}`}
              className="text-sm text-white/90 hover:text-white underline mt-1 inline-block"
            >
              @{item.owner.slug}
            </Link>
          )}
        </div>
      </div>

      <div className="flex gap-4">
        <Button
          variant="danger"
          size="lg"
          onClick={() => swipe("dislike")}
          disabled={swiping}
          aria-label="Dislike"
        >
          ✕
        </Button>
        <Button
          variant="secondary"
          size="lg"
          onClick={() => swipe("skip")}
          disabled={swiping}
          aria-label="Skip"
        >
          Skip
        </Button>
        <Button
          variant="primary"
          size="lg"
          onClick={() => swipe("like")}
          disabled={swiping}
          aria-label="Like"
        >
          ♥
        </Button>
      </div>

      <p className="text-sm text-neutral-500">
        {currentIndex + 1} / {items.length}
      </p>
    </div>
  );
}
