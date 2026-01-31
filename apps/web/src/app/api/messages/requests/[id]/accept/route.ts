import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@exibidos/db/client";
import { authOptions } from "@/lib/auth/config";

export async function POST(
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
  const mr = await prisma.messageRequest.findUnique({
    where: { id },
    include: { from: true },
  });
  if (!mr || mr.toId !== session.user.id) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }
  if (mr.status !== "pending") {
    return NextResponse.json({ error: "already_handled", status: mr.status }, { status: 409 });
  }

  await prisma.messageRequest.update({
    where: { id },
    data: { status: "accepted" },
  });

  const existing = await prisma.conversation.findFirst({
    where: {
      AND: [
        { participants: { some: { userId: mr.fromId } } },
        { participants: { some: { userId: mr.toId } } },
      ],
    },
    include: { participants: true },
  });
  if (!existing || existing.participants.length !== 2) {
    await prisma.conversation.create({
      data: {
        participants: {
          create: [{ userId: mr.fromId }, { userId: mr.toId }],
        },
      },
    });
  }
  if (mr.message) {
    const conv = await prisma.conversation.findFirst({
      where: {
        AND: [
          { participants: { some: { userId: mr.fromId } } },
          { participants: { some: { userId: mr.toId } } },
        ],
      },
    });
    if (conv) {
      await prisma.message.create({
        data: { conversationId: conv.id, senderId: mr.fromId, body: mr.message },
      });
    }
  }

  return NextResponse.json({ ok: true });
}
