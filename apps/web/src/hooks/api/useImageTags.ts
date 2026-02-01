/**
 * Image tags + votes: invalidate on add/remove/vote.
 */
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

export type TagInfo = {
  id: string;
  name: string;
  slug: string;
  category: string;
  source: string;
  confidence: number | null;
};
export type VoteInfo = { avg: number; count: number };

export function useImageTags(imageId: string | null) {
  return useQuery({
    queryKey: ["images", imageId, "tags"],
    queryFn: async () => {
      if (!imageId) return null;
      const res = await fetch(`/api/images/${imageId}/tags`);

      if (!res.ok) return null;

      return res.json() as Promise<{ tags: (TagInfo & { votes: VoteInfo })[] }>;
    },
    enabled: !!imageId,
  });
}

export function useAddTag(imageId: string) {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (tagId: string) => {
      const res = await fetch(`/api/images/${imageId}/tags`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tagId }),
      });

      if (res.status === 401) throw new Error("unauthorized");

      if (!res.ok) {
        const d = (await res.json().catch(() => ({}))) as { error?: string };

        throw new Error(d.error ?? "Failed");
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["images", imageId] }),
  });
}

export function useRemoveTag(imageId: string) {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (tagId: string) => {
      const res = await fetch(`/api/images/${imageId}/tags/${tagId}`, { method: "DELETE" });

      if (!res.ok) throw new Error("Failed");
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["images", imageId] }),
  });
}

export function useVote(imageId: string) {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async ({ tagId, weight }: { tagId: string; weight: number }) => {
      const res = await fetch(`/api/images/${imageId}/votes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tagId, weight }),
      });

      if (res.status === 401) throw new Error("unauthorized");

      if (!res.ok) throw new Error("Failed");
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["images", imageId] }),
  });
}
