"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

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

  if (loading) return <main style={{ padding: "1rem" }}>Loading…</main>;

  return (
    <main style={{ maxWidth: 560, margin: "0 auto", padding: "1rem" }}>
      <h1>Follow requests</h1>
      <p><Link href="/settings">Settings</Link></p>
      <ul style={{ listStyle: "none", padding: 0 }}>
        {list.map((r) => (
          <li key={r.fromId} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0.75rem 0", borderBottom: "1px solid #eee" }}>
            <div>
              {r.slug ? <Link href={`/${r.slug}`}>{r.displayName ?? r.slug}</Link> : (r.displayName ?? r.fromId)}
              {r.slug && <span style={{ color: "#666", marginLeft: "0.5rem" }}>@{r.slug}</span>}
            </div>
            <div style={{ display: "flex", gap: "0.5rem" }}>
              <button type="button" onClick={() => accept(r.fromId)}>Accept</button>
              <button type="button" onClick={() => reject(r.fromId)}>Reject</button>
            </div>
          </li>
        ))}
      </ul>
      {list.length === 0 && <p>No pending requests.</p>}
    </main>
  );
}
