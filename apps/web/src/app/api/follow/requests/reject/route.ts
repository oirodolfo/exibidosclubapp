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

  await prisma.follow.deleteMany({
    where: { fromId, toId: session.user.id, status: "pending" },
  });
  return NextResponse.json({ ok: true }, { status: 200 });
}
