"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/Button";

async function getFollowStatus(slug: string): Promise<{ following: boolean }> {
  const res = await fetch(`/api/categories/${slug}/follow`);
  if (!res.ok) throw new Error("Failed");
  return res.json();
}

export function CategoryFollowClient({ slug }: { slug: string }) {
  const qc = useQueryClient();
  const { data } = useQuery({
    queryKey: ["categoryFollow", slug],
    queryFn: () => getFollowStatus(slug),
  });
  const followMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/categories/${slug}/follow`, { method: "POST" });
      if (!res.ok) throw new Error("Failed");
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["categoryFollow", slug] }),
  });
  const unfollowMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/categories/${slug}/follow`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed");
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["categoryFollow", slug] }),
  });

  const following = data?.following ?? false;

  return (
    <div className="mt-4">
      {following ? (
        <Button
          variant="secondary"
          size="sm"
          onClick={() => unfollowMutation.mutate()}
          disabled={unfollowMutation.isPending}
        >
          Unfollow category
        </Button>
      ) : (
        <Button
          variant="primary"
          size="sm"
          onClick={() => followMutation.mutate()}
          disabled={followMutation.isPending}
        >
          Follow category
        </Button>
      )}
    </div>
  );
}
