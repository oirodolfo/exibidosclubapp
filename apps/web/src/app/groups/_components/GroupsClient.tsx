"use client";

import Link from "next/link";
import { link, listItemBordered, listReset } from "@/lib/variants";
import { useGroups } from "@/hooks/api";

export function GroupsClient() {
  const { data: groups, isLoading } = useGroups();

  if (isLoading) return <p className="text-neutral-500">Loading…</p>;
  if (!groups?.length) return <p className="text-neutral-500">No groups yet.</p>;

  return (
    <ul className={listReset}>
      {groups.map((g) => (
        <li key={g.id} className={listItemBordered}>
          <div className="flex items-center justify-between">
            <div>
              <Link href={`/groups/${g.slug}`} className={link}>
                {g.name}
              </Link>
              <p className="text-sm text-neutral-500 m-0">{g.category.name}</p>
            </div>
          </div>
        </li>
      ))}
    </ul>
  );
}
