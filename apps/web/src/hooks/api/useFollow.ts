/**
 * Follow/unfollow: invalidates profile and follow lists.
 */
import { useMutation, useQueryClient } from "@tanstack/react-query";

export function useFollow() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (slug: string) => {
      const res = await fetch("/api/follow", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug }),
      });

      if (!res.ok) throw new Error("Failed");
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["profile"] });
      qc.invalidateQueries({ queryKey: ["follow"] });
    },
  });
}

export function useUnfollow() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (slug: string) => {
      const res = await fetch(`/api/follow/unfollow?slug=${encodeURIComponent(slug)}`, { method: "POST" });

      if (!res.ok) throw new Error("Failed");
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["profile"] });
      qc.invalidateQueries({ queryKey: ["follow"] });
    },
  });
}
