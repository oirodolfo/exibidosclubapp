"use client";

import Link from "next/link";
import { link, listItemBordered, listReset } from "@/lib/variants";
import { useConversations } from "@/hooks/api";

export function MessagesClient() {
  const { data: convs, isLoading } = useConversations();

  if (isLoading) return <p className="text-neutral-500">Loading…</p>;
  if (!convs?.length) {
    return (
      <p className="text-neutral-500">
        No conversations. Visit a profile and send a message request to start.
      </p>
    );
  }

  return (
    <ul className={listReset}>
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
