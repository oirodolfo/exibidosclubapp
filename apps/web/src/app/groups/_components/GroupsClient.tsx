"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { link, listItemBordered, listReset } from "@/lib/variants";

type Group = { id: string; name: string; slug: string; description: string | null; category: { name: string } };

export function GroupsClient() {
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/groups")
      .then((r) => (r.ok ? r.json() : { groups: [] }))
      .then((d) => setGroups(d.groups ?? []))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p className="text-neutral-500">Loading…</p>;
  if (groups.length === 0) return <p className="text-neutral-500">No groups yet.</p>;

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
