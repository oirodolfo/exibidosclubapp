"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import {
  link,
  listReset,
  listItemRow,
  page,
  slugHandle,
  mainBlock,
} from "@/lib/variants";
import {
  useFollowRequests,
  useAcceptFollowRequest,
  useRejectFollowRequest,
} from "@/hooks/api";

export default function FollowRequestsPage() {
  const router = useRouter();
  const { data: list, isLoading, error } = useFollowRequests();
  const acceptMutation = useAcceptFollowRequest();
  const rejectMutation = useRejectFollowRequest();

  if (error?.message === "unauthorized") {
    router.replace("/auth/login?callbackUrl=/follow/requests");
    return null;
  }
  if (isLoading) return <main className={mainBlock}>Loading…</main>;

  const requests = list ?? [];

  return (
    <main className={page.mid}>
      <h1>Follow requests</h1>
      <p>
        <Link href="/settings" className={link}>Settings</Link>
      </p>
      <ul className={listReset}>
        {requests.map((r) => (
          <li key={r.fromId} className={listItemRow}>
            <div>
              {r.slug ? (
                <Link href={`/${r.slug}`} className={link}>
                  {r.displayName ?? r.slug}
                </Link>
              ) : (
                r.displayName ?? r.fromId
              )}
              {r.slug && <span className={slugHandle}>@{r.slug}</span>}
            </div>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="primary"
                size="sm"
                onClick={() =>
                  acceptMutation.mutate(r.fromId, {
                    onSuccess: () => {},
                  })
                }
                disabled={acceptMutation.isPending || rejectMutation.isPending}
              >
                Accept
              </Button>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => rejectMutation.mutate(r.fromId)}
                disabled={acceptMutation.isPending || rejectMutation.isPending}
              >
                Reject
              </Button>
            </div>
          </li>
        ))}
      </ul>
      {requests.length === 0 && <p>No pending requests.</p>}
    </main>
  );
}
