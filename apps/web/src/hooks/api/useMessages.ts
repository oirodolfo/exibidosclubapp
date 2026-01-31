/**
 * Messages: conversations + send. Invalidate on new message.
 */
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

export type Conversation = {
  id: string;
  other: { id: string; name: string | null; slug: string | null } | null;
  lastMessage: { body: string; createdAt: string } | null;
};

export type Message = { id: string; senderId: string; body: string; createdAt: string };

export function useConversations() {
  return useQuery({
    queryKey: ["messages", "conversations"],
    queryFn: async () => {
      const res = await fetch("/api/messages/conversations");
      if (!res.ok) return [];
      const d = (await res.json()) as { conversations?: Conversation[] };
      return d.conversations ?? [];
    },
  });
}

export function useConversation(conversationId: string | null) {
  return useQuery({
    queryKey: ["messages", "conversation", conversationId],
    queryFn: async () => {
      if (!conversationId) return null;
      const res = await fetch(`/api/messages/conversations/${conversationId}`);
      if (!res.ok) return null;
      return res.json() as Promise<{
        conversationId: string;
        other: { id: string; name: string | null; slug: string | null } | null;
        messages: Message[];
      }>;
    },
    enabled: !!conversationId,
  });
}

export function useSendMessage(conversationId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (body: string) => {
      const res = await fetch(`/api/messages/conversations/${conversationId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body }),
      });
      if (!res.ok) throw new Error("Failed");
      return res.json() as Promise<Message>;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["messages", "conversation", conversationId] });
      qc.invalidateQueries({ queryKey: ["messages", "conversations"] });
    },
  });
}
