"use client";

import Link from "next/link";
import { cn } from "@/lib/cn";

export type TabId = "overview" | "photos" | "activity" | "rankings" | "badges";

const TABS: { id: TabId; label: string }[] = [
  { id: "overview", label: "Overview" },
  { id: "photos", label: "Photos" },
  { id: "activity", label: "Activity" },
  { id: "rankings", label: "Rankings" },
  { id: "badges", label: "Badges" },
];

export function ProfileTabs({ slug, current }: { slug: string; current: TabId }) {
  return (
    <nav className="flex gap-4 border-b border-neutral-300 mb-4">
      {TABS.map(({ id, label }) => (
        <Link
          key={id}
          href={`/${slug}${id === "overview" ? "" : `?tab=${id}`}`}
          className={cn(
            "pb-2 px-3 no-underline border-b-2 -mb-px transition-colors",
            current === id ? "border-neutral-900 text-inherit" : "border-transparent text-neutral-500 hover:text-neutral-700"
          )}
        >
          {label}
        </Link>
      ))}
    </nav>
  );
}
