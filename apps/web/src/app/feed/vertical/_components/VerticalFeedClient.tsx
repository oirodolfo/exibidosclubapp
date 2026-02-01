"use client";

import { useEffect, useRef, useCallback, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useSwipeFeed, useSwipeMutation } from "@/hooks/api";
import { ReactionBar } from "./ReactionBar";
import { CommentsSheet } from "./CommentsSheet";

export function VerticalFeedClient() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [commentImageId, setCommentImageId] = useState<string | null>(null);
  const { data, isLoading, error, refetch, fetchNextPage, hasNextPage, isFetchingNextPage } =
    useSwipeFeed();
  const swipeMutation = useSwipeMutation();

  const allItems = data?.pages.flatMap((p) => p.feed) ?? [];
  const currentIndexRef = useRef(0);

  const loadMoreIfNeeded = useCallback(() => {
    const idx = currentIndexRef.current;

    if (idx >= allItems.length - 2 && hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [allItems.length, hasNextPage, isFetchingNextPage, fetchNextPage]);

  useEffect(() => {
    loadMoreIfNeeded();
  }, [allItems.length, loadMoreIfNeeded]);

  const handleScroll = useCallback(() => {
    if (!containerRef.current) return;
    const scrollTop = containerRef.current.scrollTop;
    const viewportHeight = containerRef.current.clientHeight;
    const index = Math.round(scrollTop / viewportHeight);

    if (index !== currentIndexRef.current) {
      currentIndexRef.current = index;
      loadMoreIfNeeded();
    }
  }, [loadMoreIfNeeded]);

  if (isLoading) {
    return (
      <div className="fixed inset-0 flex flex-col bg-exibidos-bg">
        <div className="h-screen w-full animate-pulse bg-exibidos-surface" />
        <div className="h-screen w-full animate-pulse bg-exibidos-surface" />
        <div className="flex h-screen w-full items-center justify-center">
          <p className="text-exibidos-muted text-sm">Loading feed...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="fixed inset-0 flex flex-col items-center justify-center gap-4 bg-exibidos-bg p-4">
        <p className="text-exibidos-magenta">{error.message}</p>
        <button
          type="button"
          onClick={() => refetch()}
          className="text-exibidos-purple underline"
        >
          Retry
        </button>
      </div>
    );
  }

  if (allItems.length === 0) {
    return (
      <div className="fixed inset-0 flex flex-col items-center justify-center gap-4 bg-exibidos-bg p-4">
        <p className="text-exibidos-muted text-center">No posts yet. Check back later!</p>
        <Link href="/feed" className="text-exibidos-purple underline">
          Back to feed
        </Link>
      </div>
    );
  }

  return (
    <>
      <Link
        href="/feed"
        className="fixed top-4 left-4 z-20 rounded-full bg-black/50 px-4 py-2 text-sm text-white hover:bg-black/70"
      >
        ← Back
      </Link>
      <div
        ref={containerRef}
        className="fixed inset-0 overflow-y-auto snap-y snap-mandatory overscroll-none bg-exibidos-bg"
        onScroll={handleScroll}
        style={{ scrollSnapType: "y mandatory" }}
      >
      {allItems.map((item) => (
        <section
          key={item.id}
          className="h-screen w-full flex-shrink-0 snap-start snap-always flex flex-col justify-end bg-black"
          aria-label={item.caption ?? "Post"}
        >
          <div className="absolute inset-0">
            {item.thumbUrl ? (
              <Image
                src={item.thumbUrl}
                alt={item.caption ?? ""}
                fill
                className="object-contain"
                sizes="100vw"
                unoptimized
              />
            ) : (
              <div className="h-full w-full flex items-center justify-center text-exibidos-muted">
                [image]
              </div>
            )}
          </div>
          <div className="relative z-10 bg-gradient-to-t from-black/80 to-transparent p-6 pb-12 text-white">
            {item.caption && <p className="m-0 text-base">{item.caption}</p>}
            {item.owner.slug && (
              <Link
                href={`/${item.owner.slug}`}
                className="mt-2 inline-block text-sm text-white/90 hover:text-white underline"
              >
                @{item.owner.slug}
              </Link>
            )}
            <div className="mt-4 flex flex-wrap items-center gap-3">
              <ReactionBar imageId={item.id} />
              <button
                type="button"
                onClick={() => setCommentImageId(item.id)}
                className="rounded-full bg-white/20 px-4 py-2 text-sm font-medium hover:bg-white/30"
                aria-label="Comments"
              >
                💬 Comments
              </button>
              <button
                type="button"
                onClick={() => {
                  if (swipeMutation.isPending) return;
                  swipeMutation.mutate({ imageId: item.id, direction: "dislike" });
                }}
                disabled={swipeMutation.isPending}
                className="rounded-full bg-white/20 px-4 py-2 text-sm font-medium hover:bg-white/30 disabled:opacity-50"
                aria-label="Dislike"
              >
                ✕
              </button>
              <button
                type="button"
                onClick={() => {
                  if (swipeMutation.isPending) return;
                  swipeMutation.mutate({ imageId: item.id, direction: "like" });
                }}
                disabled={swipeMutation.isPending}
                className="rounded-full bg-exibidos-lime px-4 py-2 text-sm font-semibold text-exibidos-bg transition-transform hover:scale-105 hover:opacity-90 active:scale-95 disabled:opacity-50"
                aria-label="Like"
              >
                ♥ Like
              </button>
            </div>
          </div>
        </section>
      ))}
      {isFetchingNextPage && (
        <div className="h-screen flex-shrink-0 snap-start flex items-center justify-center">
          <p className="text-exibidos-muted text-sm">Loading more...</p>
        </div>
      )}
      </div>
      {commentImageId && (
        <CommentsSheet
          imageId={commentImageId}
          onClose={() => setCommentImageId(null)}
        />
      )}
    </>
  );
}
