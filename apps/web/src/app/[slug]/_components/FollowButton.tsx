"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { useFollow, useUnfollow } from "@/hooks/api";

type Status = "none" | "pending" | "accepted";

export function FollowButton({ slug, followStatus }: { slug: string; followStatus: Status }) {
  const router = useRouter();
  const followMutation = useFollow();
  const unfollowMutation = useUnfollow();

  const follow = () =>
    followMutation.mutate(slug, { onSuccess: () => router.refresh() });
  const unfollow = () =>
    unfollowMutation.mutate(slug, { onSuccess: () => router.refresh() });

  const loading = followMutation.isPending || unfollowMutation.isPending;

  if (followStatus === "accepted")
    return (
      <Button type="button" variant="secondary" onClick={unfollow} disabled={loading}>
        {loading ? "…" : "Unfollow"}
      </Button>
    );
  if (followStatus === "pending") return <span>Requested</span>;
  return (
    <Button type="button" variant="secondary" onClick={follow} disabled={loading}>
      {loading ? "…" : "Follow"}
    </Button>
  );
}
