import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { prisma } from "@exibidos/db/client";
import { authOptions } from "@/lib/auth/config";

const PostBody = z.object({ body: z.string().min(1).max(2000) });

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  if (process.env.FEATURE_MESSAGING !== "true") {
    return NextResponse.json({ error: "messaging_disabled" }, { status: 403 });
  }

  const { id } = await params;
  const part = await prisma.conversationParticipant.findFirst({
    where: { conversationId: id, userId: session.user.id },
    include: {
      conversation: {
        include: {
          participants: { include: { user: { select: { id: true, name: true }, include: { slugs: { select: { slug: true }, take: 1 } } } } },
          messages: { where: { deletedAt: null }, orderBy: { createdAt: "asc" } },
        },
      },
    },
  });
  if (!part) return NextResponse.json({ error: "not_found" }, { status: 404 });

  const other = part.conversation.participants.find((p) => p.userId !== session.user!.id);
  const messages = part.conversation.messages.map((m) => ({
    id: m.id,
    senderId: m.senderId,
    body: m.body,
    readAt: m.readAt,
    createdAt: m.createdAt,
  }));

  return NextResponse.json({
    conversationId: id,
    other: other ? { id: other.user.id, name: other.user.name, slug: other.user.slugs[0]?.slug } : null,
    messages,
  });
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  if (process.env.FEATURE_MESSAGING !== "true") {
    return NextResponse.json({ error: "messaging_disabled" }, { status: 403 });
  }

  const { id } = await params;
  const part = await prisma.conversationParticipant.findFirst({
    where: { conversationId: id, userId: session.user.id },
  });
  if (!part) return NextResponse.json({ error: "not_found" }, { status: 404 });

  const parse = PostBody.safeParse(await req.json());
  if (!parse.success) return NextResponse.json({ error: "validation_failed" }, { status: 400 });

  const message = await prisma.message.create({
    data: { conversationId: id, senderId: session.user.id, body: parse.data.body },
  });

  return NextResponse.json(message, { status: 201 });
}
