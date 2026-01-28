import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { prisma } from "@exibidos/db/client";
import { authOptions } from "@/lib/auth/config";

const Body = z.object({ fromId: z.string().cuid() });

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const parse = Body.safeParse(await req.json());
  if (!parse.success) return NextResponse.json({ error: "validation_failed" }, { status: 400 });
  const { fromId } = parse.data;

  const updated = await prisma.follow.updateMany({
    where: { fromId, toId: session.user.id, status: "pending" },
    data: { status: "accepted" },
  });
  if (updated.count === 0) return NextResponse.json({ error: "not_found" }, { status: 404 });
  return NextResponse.json({ ok: true }, { status: 200 });
}
