/**
 * Comments for an image (vertical feed).
 */
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

export type CommentItem = {
  id: string;
  body: string;
  createdAt: string;
  user: { id: string; name: string | null; slug: string | null };
};

async function fetchComments(imageId: string): Promise<{ comments: CommentItem[] }> {
  const res = await fetch(`/api/images/${imageId}/comments`);
  if (!res.ok) {
    const d = (await res.json().catch(() => ({}))) as { error?: string };
    throw new Error(d.error ?? "Failed to load comments");
  }
  return res.json();
}

export function useComments(imageId: string) {
  return useQuery({
    queryKey: ["comments", imageId],
    queryFn: () => fetchComments(imageId),
    enabled: !!imageId,
  });
}

export function useAddComment(imageId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (body: string) => {
      const res = await fetch(`/api/images/${imageId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body }),
      });
      if (!res.ok) {
        const d = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(d.error ?? "Failed to post comment");
      }
      return res.json() as Promise<CommentItem>;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["comments", imageId] }),
  });
}
