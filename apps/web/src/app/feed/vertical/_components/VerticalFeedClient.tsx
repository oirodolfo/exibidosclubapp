"use client";

import { useEffect, useRef, useCallback, useState } from "react";
import Link from "next/link";
import { useSwipeFeed, useSwipeMutation, useComments, useAddComment } from "@/hooks/api";

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
  }, [currentIndexRef.current, allItems.length, loadMoreIfNeeded]);

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
      <div className="fixed inset-0 flex items-center justify-center bg-exibidos-bg">
        <p className="text-exibidos-muted">Loading...</p>
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
            {item.imageUrl ?? item.thumbUrl ? (
              <img
                src={item.imageUrl ?? item.thumbUrl ?? ""}
                alt={item.caption ?? ""}
                className="h-full w-full object-contain"
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
            <div className="mt-4 flex flex-wrap gap-3">
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
                className="rounded-full bg-exibidos-lime px-4 py-2 text-sm font-semibold text-exibidos-bg hover:opacity-90 disabled:opacity-50"
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

function CommentsSheet({
  imageId,
  onClose,
}: {
  imageId: string;
  onClose: () => void;
}) {
  const [body, setBody] = useState("");
  const { data, isLoading } = useComments(imageId);
  const addComment = useAddComment(imageId);
  const comments = data?.comments ?? [];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = body.trim();
    if (!trimmed || addComment.isPending) return;
    addComment.mutate(trimmed, {
      onSuccess: () => setBody(""),
    });
  };

  return (
    <div className="fixed inset-0 z-30 flex flex-col bg-exibidos-bg/95 backdrop-blur-sm">
      <div className="flex items-center justify-between border-b border-white/10 p-4">
        <h2 className="text-lg font-semibold text-exibidos-ink">Comments</h2>
        <button
          type="button"
          onClick={onClose}
          className="rounded-full bg-white/10 px-4 py-2 text-sm font-medium hover:bg-white/20"
        >
          Close
        </button>
      </div>
      <div className="flex-1 overflow-y-auto p-4">
        {isLoading ? (
          <p className="text-exibidos-muted text-sm">Loading comments...</p>
        ) : comments.length === 0 ? (
          <p className="text-exibidos-muted text-sm">No comments yet.</p>
        ) : (
          <ul className="space-y-3">
            {comments.map((c) => (
              <li key={c.id} className="rounded-lg bg-exibidos-surface/80 p-3">
                <p className="text-exibidos-ink-soft text-sm">
                  {c.user.slug ? `@${c.user.slug}` : c.user.name ?? "User"}
                </p>
                <p className="text-exibidos-ink text-sm">{c.body}</p>
              </li>
            ))}
          </ul>
        )}
      </div>
      <form onSubmit={handleSubmit} className="border-t border-white/10 p-4">
        <div className="flex gap-2">
          <input
            type="text"
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Add a comment..."
            maxLength={2000}
            className="flex-1 rounded-exibidos-md border border-white/15 bg-exibidos-surface px-4 py-3 text-exibidos-ink placeholder:text-exibidos-muted focus:border-exibidos-purple focus:outline-none focus:ring-2 focus:ring-exibidos-purple/30"
          />
          <button
            type="submit"
            disabled={!body.trim() || addComment.isPending}
            className="rounded-full bg-exibidos-lime px-4 py-3 font-semibold text-exibidos-bg disabled:opacity-50"
          >
            Post
          </button>
        </div>
      </form>
    </div>
  );
}
