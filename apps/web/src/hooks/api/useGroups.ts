/**
 * Groups: list. Long cache (static data).
 */
import { useQuery } from "@tanstack/react-query";

export type Group = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  category: { name: string };
};

export function useGroups() {
  return useQuery({
    queryKey: ["groups"],
    queryFn: async () => {
      const res = await fetch("/api/groups");
      if (!res.ok) return [];
      const d = (await res.json()) as { groups?: Group[] };
      return d.groups ?? [];
    },
    staleTime: 10 * 60 * 1000,
  });
}
