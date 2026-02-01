"use client";

import { useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/Button";
import { link } from "@/lib/variants";
import { useSwipeFeed, useSwipeMutation } from "@/hooks/api";
import { useSwipeStore } from "@/stores";

export function SwipeFeed() {
  const { currentIndex, setCurrentIndex } = useSwipeStore();
  const { data, isLoading, error, refetch, fetchNextPage, hasNextPage, isFetchingNextPage } =
    useSwipeFeed();
  const swipeMutation = useSwipeMutation();

  const allItems = data?.pages.flatMap((p) => p.feed) ?? [];
  const item = allItems[currentIndex];

  useEffect(() => {
    if (currentIndex >= allItems.length - 3 && hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [currentIndex, allItems.length, hasNextPage, isFetchingNextPage, fetchNextPage]);

  const swipe = (direction: "like" | "dislike" | "skip") => {
    if (!item || swipeMutation.isPending) return;
    swipeMutation.mutate(
      { imageId: item.id, direction },
      {
        onSuccess: () => setCurrentIndex((i) => i + 1),
        onError: () => {},
      }
    );
  };

  if (isLoading) return <p className="text-neutral-500 py-8">Loading...</p>;
  if (error)
    return (
      <p className="text-red-600 py-4">
        {error.message}{" "}
        <button type="button" onClick={() => refetch()} className={link}>
          Retry
        </button>
      </p>
    );
  if (allItems.length === 0)
    return (
      <div className="py-12 text-center">
        <p className="text-neutral-500">No images to swipe. Check back later!</p>
        <p className="mt-4">
          <Link href="/" className={link}>Explore profiles</Link>
        </p>
      </div>
    );

  if (!item)
    return (
      <div className="py-12 text-center">
        <p className="text-neutral-500">You&apos;ve seen everything for now.</p>
        <p className="mt-4">
          <Link href="/" className={link}>Explore profiles</Link>
        </p>
      </div>
    );

  return (
    <div className="flex flex-col items-center gap-6">
      <div
        className="relative w-full max-w-[400px] aspect-square rounded-xl overflow-hidden bg-neutral-200 shadow-lg"
        role="img"
        aria-label={item.caption ?? "Photo"}
      >
        {item.thumbUrl ? (
          <Image
            src={item.thumbUrl}
            alt={item.caption ?? ""}
            fill
            className="object-cover"
            sizes="400px"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-neutral-400">[img]</div>
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
          disabled={swipeMutation.isPending}
          aria-label="Dislike"
        >
          ✕
        </Button>
        <Button
          variant="secondary"
          size="lg"
          onClick={() => swipe("skip")}
          disabled={swipeMutation.isPending}
          aria-label="Skip"
        >
          Skip
        </Button>
        <Button
          variant="primary"
          size="lg"
          onClick={() => swipe("like")}
          disabled={swipeMutation.isPending}
          aria-label="Like"
        >
          ♥
        </Button>
      </div>

      <p className="text-sm text-neutral-500">
        {currentIndex + 1} / {allItems.length}
      </p>
    </div>
  );
}
