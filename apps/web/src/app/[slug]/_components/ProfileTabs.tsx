"use client";

import Link from "next/link";

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
    <nav style={{ display: "flex", gap: "1rem", borderBottom: "1px solid #ccc", marginBottom: "1rem" }}>
      {TABS.map(({ id, label }) => (
        <Link
          key={id}
          href={`/${slug}${id === "overview" ? "" : `?tab=${id}`}`}
          style={{
            padding: "0.5rem 0.75rem",
            textDecoration: "none",
            color: current === id ? "inherit" : "#666",
            borderBottom: current === id ? "2px solid #333" : "2px solid transparent",
          }}
        >
          {label}
        </Link>
      ))}
    </nav>
  );
}
