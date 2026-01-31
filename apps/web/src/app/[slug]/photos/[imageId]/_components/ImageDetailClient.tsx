"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { field, fieldLabel } from "@/lib/variants";
import {
  useCategories,
  useImageTags,
  useAddTag,
  useRemoveTag,
  useVote,
} from "@/hooks/api";

type TagInfo = {
  id: string;
  name: string;
  slug: string;
  category: string;
  source: string;
  confidence: number | null;
};
type VoteInfo = { avg: number; count: number };

type Props = {
  imageId: string;
  tags: TagInfo[];
  voteByTag: Record<string, VoteInfo>;
  slug: string;
};

export function ImageDetailClient({ imageId, tags: initialTags, voteByTag: initialVotes, slug }: Props) {
  const router = useRouter();
  const { data: categoriesData } = useCategories();
  const { data: tagsData } = useImageTags(imageId);
  const addTag = useAddTag(imageId);
  const removeTag = useRemoveTag(imageId);
  const vote = useVote(imageId);
  const [selectedTagId, setSelectedTagId] = useState("");
  const [voteWeight, setVoteWeight] = useState(5);

  const categories = categoriesData ?? [];
  const tagsFromApi = tagsData?.tags as
    | Array<TagInfo & { category?: { name: string }; votes?: VoteInfo }>
    | undefined;
  const localTags: TagInfo[] = tagsFromApi
    ? tagsFromApi.map((t) => ({
        id: t.id,
        name: t.name,
        slug: t.slug,
        category: t.category?.name ?? "",
        source: t.source,
        confidence: t.confidence,
      }))
    : initialTags;
  const voteByTag: Record<string, VoteInfo> = tagsFromApi
    ? Object.fromEntries(
        tagsFromApi.map((t) => [t.id, t.votes ?? { avg: 0, count: 0 }])
      )
    : initialVotes;

  const allTags = categories.flatMap((c) =>
    c.tags.map((t) => ({ ...t, category: c.name }))
  );
  const availableToAdd = allTags.filter((t) => !localTags.some((lt) => lt.id === t.id));
  const loading = addTag.isPending || removeTag.isPending || vote.isPending;

  const handleAddTag = (tagId: string) => {
    if (!tagId) return;
    addTag.mutate(tagId, {
      onSuccess: () => {
        setSelectedTagId("");
        router.refresh();
      },
      onError: (e) => {
        if (e.message === "unauthorized")
          router.replace(`/auth/login?callbackUrl=/${slug}/photos/${imageId}`);
      },
    });
  };

  const handleRemoveTag = (tagId: string) => {
    removeTag.mutate(tagId, { onSuccess: () => router.refresh() });
  };

  const handleVote = (tagId: string, weight: number) => {
    vote.mutate(
      { tagId, weight },
      {
        onSuccess: () => router.refresh(),
        onError: (e) => {
          if (e.message === "unauthorized")
            router.replace(`/auth/login?callbackUrl=/${slug}/photos/${imageId}`);
        },
      }
    );
  };

  return (
    <div>
      {(addTag.error || removeTag.error || vote.error) && (
        <p className="text-red-600 text-sm mb-2">
          {addTag.error?.message ?? removeTag.error?.message ?? vote.error?.message}
        </p>
      )}
      <ul className="list-none p-0 m-0 space-y-2">
        {localTags.map((t) => (
          <li key={t.id} className="flex items-center justify-between gap-2 py-2 border-b border-neutral-200">
            <span>
              <strong>{t.name}</strong>
              <span className="text-neutral-500 text-sm ml-2">({t.category})</span>
              {voteByTag[t.id] && (
                <span className="text-neutral-500 text-sm ml-2">
                  — {voteByTag[t.id].count} vote{voteByTag[t.id].count !== 1 ? "s" : ""}, avg{" "}
                  {voteByTag[t.id].avg.toFixed(1)}
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
                  <option key={w} value={w}>
                    {w === -1 ? "Disagree" : w}
                  </option>
                ))}
              </select>
              <Button
                size="sm"
                variant="secondary"
                onClick={() => handleVote(t.id, voteWeight)}
                disabled={loading}
              >
                Vote
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => handleRemoveTag(t.id)}
                disabled={loading}
              >
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
                <option key={t.id} value={t.id}>
                  {t.name} ({t.category})
                </option>
              ))}
            </select>
            <Button
              onClick={() => handleAddTag(selectedTagId)}
              disabled={loading || !selectedTagId}
            >
              Add
            </Button>
          </div>
        </div>
      )}
      {localTags.length === 0 && availableToAdd.length === 0 && categories.length === 0 && (
        <p className="text-neutral-500">No tags yet. Add categories in seed.</p>
      )}
    </div>
  );
}
