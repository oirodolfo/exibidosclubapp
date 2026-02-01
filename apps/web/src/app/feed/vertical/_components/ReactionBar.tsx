"use client";

import {
  useReactions,
  useSetReaction,
  useRemoveReaction,
  REACTION_EMOJIS,
  REACTION_TYPES,
  type ReactionType,
} from "@/hooks/api";

export function ReactionBar({ imageId }: { imageId: string }) {
  const { data } = useReactions(imageId);
  const setReaction = useSetReaction(imageId);
  const removeReaction = useRemoveReaction(imageId);
  const byType = data?.byType ?? {};
  const myReaction = data?.myReaction ?? null;

  const handleClick = (type: ReactionType) => {
    if (setReaction.isPending || removeReaction.isPending) return;

    if (myReaction === type) {
      removeReaction.mutate();
    } else {
      setReaction.mutate(type);
    }
  };

  return (
    <div className="flex items-center gap-1 rounded-full bg-white/15 py-1 pl-2 pr-2">
      {REACTION_TYPES.map((type) => {
        const count = byType[type] ?? 0;
        const isActive = myReaction === type;

        return (
          <button
            key={type}
            type="button"
            onClick={() => handleClick(type)}
            title={type}
            className={`flex items-center gap-0.5 rounded-full px-2 py-1 text-lg transition-transform hover:scale-125 active:scale-110 ${
              isActive ? "bg-white/30 ring-1 ring-white/50" : "hover:bg-white/20"
            }`}
            aria-label={`${type}${count ? ` (${count})` : ""}`}
          >
            <span>{REACTION_EMOJIS[type]}</span>
            {count > 0 && (
              <span className="ml-0.5 text-xs text-white/90">{count}</span>
            )}
          </button>
        );
      })}
    </div>
  );
}
