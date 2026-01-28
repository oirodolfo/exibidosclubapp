type BadgeItem = { key: string; name: string; description: string | null; earnedAt: Date };

import { badgeCard, badgeList, text } from "@/lib/variants";

type Props = { badges: BadgeItem[] };

export function BadgesTab({ badges }: Props) {
  if (badges.length === 0) {
    return <p>No badges yet.</p>;
  }

  return (
    <section>
      <ul className={badgeList}>
        {badges.map((b) => (
          <li key={b.key} className={badgeCard}>
            <strong>{b.name}</strong>
            {b.description && <p className={`mt-1 text-sm ${text.muted}`}>{b.description}</p>}
            <p className={`mt-1 text-xs text-neutral-400`}>Earned {new Date(b.earnedAt).toLocaleDateString()}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}
