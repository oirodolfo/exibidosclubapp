"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { useConversation, useSendMessage } from "@/hooks/api";

type Props = { conversationId: string; currentUserId: string };

export function ConversationClient({ conversationId, currentUserId }: Props) {
  const [body, setBody] = useState("");
  const { data, isLoading } = useConversation(conversationId);
  const sendMutation = useSendMessage(conversationId);

  const messages = data?.messages ?? [];
  const other = data?.other ?? null;

  const send = () => {
    if (!body.trim()) return;
    const msg = body.trim();

    setBody("");
    sendMutation.mutate(msg);
  };

  if (isLoading) return <p className="text-neutral-500">Loading…</p>;

  return (
    <div>
      <h2 className="text-lg mb-4">
        {other?.slug ? `@${other.slug}` : other?.name ?? "Chat"}
      </h2>
      <div className="space-y-2 max-h-[400px] overflow-y-auto mb-4">
        {messages.map((m) => (
          <div
            key={m.id}
            className={`p-2 rounded max-w-[80%] ${m.senderId === currentUserId ? "ml-auto bg-neutral-800 text-white" : "ml-0 bg-neutral-100"}`}
          >
            <p className="m-0 text-sm whitespace-pre-wrap">{m.body}</p>
            <p className="m-0 text-xs opacity-70 mt-1">
              {new Date(m.createdAt).toLocaleString()}
            </p>
          </div>
        ))}
      </div>
      <div className="flex gap-2">
        <input
          type="text"
          value={body}
          onChange={(e) => setBody(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && send()}
          placeholder="Type a message…"
          className="flex-1 rounded border border-neutral-300 px-3 py-2 text-sm"
        />
        <Button onClick={send} disabled={sendMutation.isPending}>
          Send
        </Button>
      </div>
    </div>
  );
}
