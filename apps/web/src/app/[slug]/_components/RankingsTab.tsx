"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { link, listReset } from "@/lib/variants";

type RankingItem = {
  rank: number;
  imageId: string;
  score: number;
  thumbUrl: string | null;
  caption: string | null;
  owner: { id: string; name: string | null; slug: string | null };
};

type Props = { rankingsEnabled?: boolean };

export function RankingsTab({ rankingsEnabled = true }: Props) {
  const [rankings, setRankings] = useState<RankingItem[]>([]);
  const [period, setPeriod] = useState("weekly");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!rankingsEnabled) return;
    setLoading(true);
    setError(null);
    fetch(`/api/rankings?period=${period}`)
      .then((r) => {
        if (!r.ok) throw new Error("Failed");
        return r.json();
      })
      .then((d) => {
        setRankings(d.rankings ?? []);
      })
      .catch(() => setError("Could not load rankings"))
      .finally(() => setLoading(false));
  }, [period, rankingsEnabled]);

  if (!rankingsEnabled) return <p className="text-neutral-500">Rankings are disabled.</p>;
  if (error) return <p className="text-red-600">{error}</p>;
  if (loading) return <p className="text-neutral-500">Loading rankings…</p>;
  if (rankings.length === 0) {
    return <p className="text-neutral-500">No rankings yet. Like images in Swipe to build them!</p>;
  }

  return (
    <section>
      <div className="mb-4 flex gap-2">
        {["daily", "weekly", "monthly", "alltime"].map((p) => (
          <button
            key={p}
            type="button"
            onClick={() => setPeriod(p)}
            className={`rounded px-3 py-1 text-sm ${period === p ? "bg-neutral-900 text-white" : "bg-neutral-200 hover:bg-neutral-300"}`}
          >
            {p}
          </button>
        ))}
      </div>
      <ul className={`${listReset} space-y-3`}>
        {rankings.map((r) => (
          <li key={r.imageId} className="flex items-center gap-3 py-2 border-b border-neutral-200">
            <span className="font-bold text-lg w-8">#{r.rank}</span>
            <div className="w-12 h-12 flex-shrink-0 rounded overflow-hidden bg-neutral-200">
              {r.thumbUrl ? (
                <img src={r.thumbUrl} alt="" className="w-full h-full object-cover" />
              ) : (
                <span className="text-xs text-neutral-400 flex items-center justify-center h-full">—</span>
              )}
            </div>
            <div className="min-w-0 flex-1">
              {r.caption && <p className="text-sm truncate m-0">{r.caption}</p>}
              {r.owner.slug && (
                <Link href={`/${r.owner.slug}`} className={`text-sm ${link}`}>
                  @{r.owner.slug}
                </Link>
              )}
            </div>
            <span className="text-sm text-neutral-500">{r.score} likes</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
