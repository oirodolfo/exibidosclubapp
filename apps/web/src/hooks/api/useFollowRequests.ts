/**
 * Follow requests: list, accept, reject. Invalidates follow lists on success.
 */
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

export type Request = {
  fromId: string;
  slug: string | null;
  displayName: string | null;
  createdAt: string;
};

export function useFollowRequests() {
  return useQuery({
    queryKey: ["follow", "requests"],
    queryFn: async () => {
      const res = await fetch("/api/follow/requests");
      if (res.status === 401) throw new Error("unauthorized");
      const d = (await res.json()) as { requests?: Request[] };
      return d.requests ?? [];
    },
  });
}

export function useAcceptFollowRequest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (fromId: string) => {
      const res = await fetch("/api/follow/requests/accept", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fromId }),
      });
      if (!res.ok) throw new Error("Failed");
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["follow", "requests"] }),
  });
}

export function useRejectFollowRequest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (fromId: string) => {
      const res = await fetch("/api/follow/requests/reject", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fromId }),
      });
      if (!res.ok) throw new Error("Failed");
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["follow", "requests"] }),
  });
}
