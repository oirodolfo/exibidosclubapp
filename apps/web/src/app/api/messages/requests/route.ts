import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { prisma } from "@exibidos/db/client";
import { authOptions } from "@/lib/auth/config";

const PostBody = z.object({
  toId: z.string().min(1),
  message: z.string().max(500).optional(),
});

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  if (process.env.FEATURE_MESSAGING !== "true") {
    return NextResponse.json({ error: "messaging_disabled" }, { status: 403 });
  }

  const received = await prisma.messageRequest.findMany({
    where: { toId: session.user.id },
    include: { from: { select: { id: true, name: true }, include: { slugs: { select: { slug: true }, take: 1 } } } },
    orderBy: { createdAt: "desc" },
  });
  const sent = await prisma.messageRequest.findMany({
    where: { fromId: session.user.id },
    include: { to: { select: { id: true, name: true }, include: { slugs: { select: { slug: true }, take: 1 } } } },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({
    received: received.map((r) => ({
      id: r.id,
      from: { id: r.from.id, name: r.from.name, slug: r.from.slugs[0]?.slug },
      message: r.message,
      status: r.status,
      createdAt: r.createdAt,
    })),
    sent: sent.map((r) => ({
      id: r.id,
      to: { id: r.to.id, name: r.to.name, slug: r.to.slugs[0]?.slug },
      status: r.status,
      createdAt: r.createdAt,
    })),
  });
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  if (process.env.FEATURE_MESSAGING !== "true") {
    return NextResponse.json({ error: "messaging_disabled" }, { status: 403 });
  }

  const parse = PostBody.safeParse(await req.json());
  if (!parse.success) return NextResponse.json({ error: "validation_failed" }, { status: 400 });
  const { toId, message } = parse.data;

  if (toId === session.user.id) {
    return NextResponse.json({ error: "cannot_message_self" }, { status: 400 });
  }

  const to = await prisma.user.findUnique({ where: { id: toId, deletedAt: null } });
  if (!to) return NextResponse.json({ error: "user_not_found" }, { status: 404 });

  const existing = await prisma.messageRequest.findUnique({
    where: { fromId_toId: { fromId: session.user.id, toId } },
  });
  if (existing) {
    return NextResponse.json({ error: "request_exists", status: existing.status }, { status: 409 });
  }

  const profile = await prisma.profile.findUnique({ where: { userId: toId } });
  const autoAccept = profile?.acceptMessageRequestsAlways ?? true;

  const req_ = await prisma.messageRequest.create({
    data: {
      fromId: session.user.id,
      toId,
      message: message ?? null,
      status: autoAccept ? "accepted" : "pending",
    },
  });

  if (autoAccept) {
    const convs = await prisma.conversation.findMany({
      where: {
        AND: [
          { participants: { some: { userId: session.user.id } } },
          { participants: { some: { userId: toId } } },
        ],
      },
      include: { participants: true },
    });
    const conv = convs.find((c) => c.participants.length === 2);
    let convId = conv?.id;
    if (!conv) {
      const newConv = await prisma.conversation.create({
        data: {
          participants: {
            create: [{ userId: session.user.id }, { userId: toId }],
          },
        },
      });
      convId = newConv.id;
    }
    if (message && convId) {
      await prisma.message.create({
        data: { conversationId: convId, senderId: session.user.id, body: message },
      });
    }
  }

  return NextResponse.json({ id: req_.id, status: req_.status }, { status: 201 });
}
