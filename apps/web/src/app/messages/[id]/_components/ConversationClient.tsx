"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/Button";

type Props = { conversationId: string; currentUserId: string };

type Message = { id: string; senderId: string; body: string; createdAt: string };

export function ConversationClient({ conversationId, currentUserId }: Props) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [other, setOther] = useState<{ name: string | null; slug: string | null } | null>(null);
  const [body, setBody] = useState("");
  const [loading, setLoading] = useState(true);
  const bottomRef = useRef<HTMLDivElement>(null);

  const fetchConv = () => {
    fetch(`/api/messages/conversations/${conversationId}`)
      .then((r) => (r.ok ? r.json() : {}))
      .then((d: { messages?: Message[]; other?: { name: string | null; slug: string | null } }) => {
        setMessages(d.messages ?? []);
        setOther(d.other ?? null);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchConv();
  }, [conversationId]);

  const send = () => {
    if (!body.trim()) return;
    const msg = body.trim();
    setBody("");
    fetch(`/api/messages/conversations/${conversationId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ body: msg }),
    })
      .then((r) => r.ok && r.json())
      .then((m) => m && setMessages((prev) => [...prev, { id: m.id, senderId: m.senderId, body: m.body, createdAt: m.createdAt }]));
  };

  if (loading) return <p className="text-neutral-500">Loading…</p>;

  return (
    <div>
      <h2 className="text-lg mb-4">{other?.slug ? `@${other.slug}` : other?.name ?? "Chat"}</h2>
      <div className="space-y-2 max-h-[400px] overflow-y-auto mb-4">
        {messages.map((m) => (
          <div
            key={m.id}
            className={`p-2 rounded max-w-[80%] ${m.senderId === currentUserId ? "ml-auto bg-neutral-800 text-white" : "ml-0 bg-neutral-100"}`}
          >
            <p className="m-0 text-sm whitespace-pre-wrap">{m.body}</p>
            <p className="m-0 text-xs opacity-70 mt-1">{new Date(m.createdAt).toLocaleString()}</p>
          </div>
        ))}
        <div ref={bottomRef} />
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
        <Button onClick={send}>Send</Button>
      </div>
    </div>
  );
}
