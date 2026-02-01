/**
 * Reactions (Facebook/Instagram style) for an image.
 */
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

export type ReactionType = "like" | "love" | "haha" | "wow" | "sad" | "angry";

export const REACTION_EMOJIS: Record<ReactionType, string> = {
  like: "👍",
  love: "❤️",
  haha: "😂",
  wow: "😮",
  sad: "😢",
  angry: "😠",
};

export const REACTION_TYPES: ReactionType[] = [
  "like",
  "love",
  "haha",
  "wow",
  "sad",
  "angry",
];

export type ReactionsData = {
  byType: Record<string, number>;
  total: number;
  myReaction: ReactionType | null;
};

async function fetchReactions(imageId: string): Promise<ReactionsData> {
  const res = await fetch(`/api/images/${imageId}/reactions`);

  if (!res.ok) {
    const d = (await res.json().catch(() => ({}))) as { error?: string };

    throw new Error(d.error ?? "Failed to load reactions");
  }

  return res.json();
}

export function useReactions(imageId: string) {
  return useQuery({
    queryKey: ["reactions", imageId],
    queryFn: () => fetchReactions(imageId),
    enabled: !!imageId,
  });
}

export function useSetReaction(imageId: string) {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (type: ReactionType) => {
      const res = await fetch(`/api/images/${imageId}/reactions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type }),
      });

      if (!res.ok) {
        const d = (await res.json().catch(() => ({}))) as { error?: string };

        throw new Error(d.error ?? "Failed to set reaction");
      }

      return res.json() as Promise<{ type: ReactionType }>;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["reactions", imageId] }),
  });
}

export function useRemoveReaction(imageId: string) {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/images/${imageId}/reactions`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const d = (await res.json().catch(() => ({}))) as { error?: string };

        throw new Error(d.error ?? "Failed to remove reaction");
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["reactions", imageId] }),
  });
}
