/**
 * Rankings: period-based. Stale 2min (data changes slowly).
 */
import { useQuery } from "@tanstack/react-query";

export type RankingItem = {
  rank: number;
  imageId: string;
  score: number;
  thumbUrl: string | null;
  caption: string | null;
  owner: { id: string; name: string | null; slug: string | null };
};

export function useRankings(period: string) {
  return useQuery({
    queryKey: ["rankings", period],
    queryFn: async () => {
      const res = await fetch(`/api/rankings?period=${period}`);
      if (!res.ok) throw new Error("Failed");
      const d = (await res.json()) as { rankings?: RankingItem[] };
      return d.rankings ?? [];
    },
    staleTime: 2 * 60 * 1000,
  });
}
