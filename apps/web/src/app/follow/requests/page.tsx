"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { link, listReset, listItemRow, page, slugHandle, mainBlock } from "@/lib/variants";

type Request = { fromId: string; slug: string | null; displayName: string | null; createdAt: string };

export default function FollowRequestsPage() {
  const [list, setList] = useState<Request[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    (async () => {
      const res = await fetch("/api/follow/requests");
      if (res.status === 401) {
        router.replace("/auth/login?callbackUrl=/follow/requests");
        return;
      }
      const data = (await res.json()) as { requests?: Request[] };
      setList(data.requests ?? []);
      setLoading(false);
    })();
  }, [router]);

  async function accept(fromId: string) {
    const res = await fetch("/api/follow/requests/accept", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ fromId }) });
    if (res.ok) setList((prev) => prev.filter((r) => r.fromId !== fromId));
  }

  async function reject(fromId: string) {
    const res = await fetch("/api/follow/requests/reject", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ fromId }) });
    if (res.ok) setList((prev) => prev.filter((r) => r.fromId !== fromId));
  }

  if (loading) return <main className={mainBlock}>Loading…</main>;

  return (
    <main className={page.mid}>
      <h1>Follow requests</h1>
      <p><Link href="/settings" className={link}>Settings</Link></p>
      <ul className={listReset}>
        {list.map((r) => (
          <li key={r.fromId} className={listItemRow}>
            <div>
              {r.slug ? <Link href={`/${r.slug}`} className={link}>{r.displayName ?? r.slug}</Link> : (r.displayName ?? r.fromId)}
              {r.slug && <span className={slugHandle}>@{r.slug}</span>}
            </div>
            <div className="flex gap-2">
              <Button type="button" variant="primary" size="sm" onClick={() => accept(r.fromId)}>Accept</Button>
              <Button type="button" variant="secondary" size="sm" onClick={() => reject(r.fromId)}>Reject</Button>
            </div>
          </li>
        ))}
      </ul>
      {list.length === 0 && <p>No pending requests.</p>}
    </main>
  );
}
