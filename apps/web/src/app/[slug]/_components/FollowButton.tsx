"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Status = "none" | "pending" | "accepted";

export function FollowButton({ slug, followStatus }: { slug: string; followStatus: Status }) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function follow() {
    setLoading(true);
    try {
      const res = await fetch("/api/follow", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ slug }) });
      if (res.ok) router.refresh();
    } finally {
      setLoading(false);
    }
  }

  async function unfollow() {
    setLoading(true);
    try {
      const res = await fetch(`/api/follow/unfollow?slug=${encodeURIComponent(slug)}`, { method: "POST" });
      if (res.ok) router.refresh();
    } finally {
      setLoading(false);
    }
  }

  if (followStatus === "accepted") {
    return <button type="button" onClick={unfollow} disabled={loading}>{loading ? "…" : "Unfollow"}</button>;
  }
  if (followStatus === "pending") {
    return <span>Requested</span>;
  }
  return <button type="button" onClick={follow} disabled={loading}>{loading ? "…" : "Follow"}</button>;
}
