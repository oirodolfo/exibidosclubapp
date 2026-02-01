import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@exibidos/db/client";
import { authOptions } from "@/lib/auth/config";

export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  if (process.env.FEATURE_MESSAGING !== "true") {
    return NextResponse.json({ error: "messaging_disabled" }, { status: 403 });
  }

  const participants = await prisma.conversationParticipant.findMany({
    where: { userId: session.user.id },
    include: {
      conversation: {
        include: {
          participants: { include: { user: { select: { id: true, name: true }, include: { slugs: { select: { slug: true }, take: 1 } } } } },
          messages: { orderBy: { createdAt: "desc" }, take: 1 },
        },
      },
    },
    orderBy: { conversation: { updatedAt: "desc" } },
  });

  const convs = participants.map((p) => {
    const other = p.conversation.participants.find((x) => x.userId !== session.user!.id);
    const lastMsg = p.conversation.messages[0];

    return {
      id: p.conversation.id,
      other: other ? { id: other.user.id, name: other.user.name, slug: other.user.slugs[0]?.slug } : null,
      lastMessage: lastMsg ? { body: lastMsg.body.slice(0, 80), createdAt: lastMsg.createdAt } : null,
    };
  });

  return NextResponse.json({ conversations: convs });
}
