"use client";

import { useState } from "react";
import { useComments, useAddComment } from "@/hooks/api";

type Props = {
  imageId: string;
  onClose: () => void;
};

export function CommentsSheet({ imageId, onClose }: Props) {
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
