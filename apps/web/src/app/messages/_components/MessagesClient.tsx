"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { link, listItemBordered, listReset } from "@/lib/variants";

type Conversation = {
  id: string;
  other: { id: string; name: string | null; slug: string | null } | null;
  lastMessage: { body: string; createdAt: string } | null;
};

export function MessagesClient() {
  const [convs, setConvs] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/messages/conversations")
      .then((r) => (r.ok ? r.json() : { conversations: [] }))
      .then((d) => setConvs(d.conversations ?? []))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p className="text-neutral-500">Loading…</p>;
  if (convs.length === 0) {
    return (
      <p className="text-neutral-500">
        No conversations. Visit a profile and send a message request to start.
      </p>
    );
  }

  return (
    <ul className={`${listReset}`}>
      {convs.map((c) => (
        <li key={c.id} className={listItemBordered}>
          <Link href={`/messages/${c.id}`} className={link}>
            {c.other?.slug ? `@${c.other.slug}` : c.other?.name ?? "Unknown"}
          </Link>
          {c.lastMessage && (
            <p className="text-sm text-neutral-500 m-0 truncate">{c.lastMessage.body}</p>
          )}
        </li>
      ))}
    </ul>
  );
}
