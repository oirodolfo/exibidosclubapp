"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { field, fieldLabel } from "@/lib/variants";

type TagInfo = { id: string; name: string; slug: string; category: string; source: string; confidence: number | null };
type VoteInfo = { avg: number; count: number };
type CategoryInfo = { id: string; name: string; slug: string; tags: { id: string; name: string; slug: string }[] };

type Props = {
  imageId: string;
  tags: TagInfo[];
  voteByTag: Record<string, VoteInfo>;
  slug: string;
};

export function ImageDetailClient({ imageId, tags, voteByTag, slug }: Props) {
  const [categories, setCategories] = useState<CategoryInfo[]>([]);
  const [localTags, setLocalTags] = useState<TagInfo[]>(tags);
  const [localVotes, setLocalVotes] = useState<Record<string, VoteInfo>>(voteByTag);
  const [selectedTagId, setSelectedTagId] = useState("");
  const [voteWeight, setVoteWeight] = useState(5);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    setLocalTags(tags);
    setLocalVotes(voteByTag);
  }, [tags, voteByTag]);

  useEffect(() => {
    (async () => {
      const res = await fetch("/api/categories");
      if (res.ok) {
        const data = (await res.json()) as { categories?: { id: string; name: string; slug: string; tags: { id: string; name: string; slug: string }[] }[] };
        if (data.categories) {
          const withTags = await Promise.all(
            (data.categories).map(async (c) => {
              const tr = await fetch(`/api/categories/${c.slug}/tags`);
              const td = (await tr.json()) as { tags?: { id: string; name: string; slug: string }[] };
              return { ...c, tags: td.tags ?? [] };
            })
          );
          setCategories(withTags);
        }
      }
    })();
  }, []);

  async function addTag() {
    if (!selectedTagId) return;
    setError(null);
    setLoading(true);
    const res = await fetch(`/api/images/${imageId}/tags`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tagId: selectedTagId }),
    });
    setLoading(false);
    if (res.status === 401) {
      router.replace(`/auth/login?callbackUrl=/${slug}/photos/${imageId}`);
      return;
    }
    if (!res.ok) {
      const d = (await res.json().catch(() => ({}))) as { error?: string };
      setError(d.error ?? "Failed");
      return;
    }
    const tag = categories.flatMap((c) => c.tags).find((t) => t.id === selectedTagId);
    if (tag) {
      setLocalTags((prev) => [...prev, { ...tag, category: categories.find((c) => c.tags.some((t) => t.id === selectedTagId))?.name ?? "", source: "user", confidence: null }]);
      setSelectedTagId("");
    }
    router.refresh();
  }

  async function removeTag(tagId: string) {
    setError(null);
    setLoading(true);
    const res = await fetch(`/api/images/${imageId}/tags/${tagId}`, { method: "DELETE" });
    setLoading(false);
    if (res.ok) {
      setLocalTags((prev) => prev.filter((t) => t.id !== tagId));
      setLocalVotes((prev) => {
        const next = { ...prev };
        delete next[tagId];
        return next;
      });
      router.refresh();
    }
  }

  async function vote(tagId: string, weight: number) {
    setError(null);
    setLoading(true);
    const res = await fetch(`/api/images/${imageId}/votes`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tagId, weight }),
    });
    setLoading(false);
    if (res.status === 401) {
      router.replace(`/auth/login?callbackUrl=/${slug}/photos/${imageId}`);
      return;
    }
    if (res.ok) {
      const v = localVotes[tagId];
      const count = (v?.count ?? 0) + 1;
      const sum = (v?.avg ?? 0) * (v?.count ?? 0) + weight;
      setLocalVotes((prev) => ({ ...prev, [tagId]: { avg: sum / count, count } }));
      router.refresh();
    }
  }

  const allTags = categories.flatMap((c) => c.tags.map((t) => ({ ...t, category: c.name })));
  const availableToAdd = allTags.filter((t) => !localTags.some((lt) => lt.id === t.id));

  return (
    <div>
      {error && <p className="text-red-600 text-sm mb-2">{error}</p>}
      <ul className="list-none p-0 m-0 space-y-2">
        {localTags.map((t) => (
          <li key={t.id} className="flex items-center justify-between gap-2 py-2 border-b border-neutral-200">
            <span>
              <strong>{t.name}</strong>
              <span className="text-neutral-500 text-sm ml-2">({t.category})</span>
              {localVotes[t.id] && (
                <span className="text-neutral-500 text-sm ml-2">
                  — {localVotes[t.id].count} vote{localVotes[t.id].count !== 1 ? "s" : ""}, avg {localVotes[t.id].avg.toFixed(1)}
                </span>
              )}
            </span>
            <div className="flex items-center gap-2">
              <select
                value={voteWeight}
                onChange={(e) => setVoteWeight(Number(e.target.value))}
                className="text-sm border rounded px-2 py-1"
              >
                {[5, 4, 3, 2, 1, -1].map((w) => (
                  <option key={w} value={w}>{w === -1 ? "Disagree" : w}</option>
                ))}
              </select>
              <Button size="sm" variant="secondary" onClick={() => vote(t.id, voteWeight)} disabled={loading}>
                Vote
              </Button>
              <Button size="sm" variant="ghost" onClick={() => removeTag(t.id)} disabled={loading}>
                Remove
              </Button>
            </div>
          </li>
        ))}
      </ul>
      {availableToAdd.length > 0 && (
        <div className={`${field} mt-4`}>
          <label className={fieldLabel}>Add tag</label>
          <div className="flex gap-2">
            <select
              value={selectedTagId}
              onChange={(e) => setSelectedTagId(e.target.value)}
              className="flex-1 border border-neutral-300 rounded px-3 py-2 text-sm"
            >
              <option value="">Select…</option>
              {availableToAdd.map((t) => (
                <option key={t.id} value={t.id}>{t.name} ({t.category})</option>
              ))}
            </select>
            <Button onClick={addTag} disabled={loading || !selectedTagId}>Add</Button>
          </div>
        </div>
      )}
      {localTags.length === 0 && availableToAdd.length === 0 && categories.length === 0 && (
        <p className="text-neutral-500">No tags yet. Add categories in seed.</p>
      )}
    </div>
  );
}
