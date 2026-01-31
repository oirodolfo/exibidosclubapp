import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { createHash } from "crypto";
import { prisma } from "@exibidos/db/client";
import { authOptions } from "@/lib/auth/config";

const PostBody = z.object({
  name: z.string().min(1).max(64),
  payload: z.record(z.unknown()).optional(),
});

export async function POST(req: Request) {
  if (process.env.FEATURE_TRACKING !== "true") {
    return NextResponse.json({ error: "tracking_disabled" }, { status: 403 });
  }

  const session = await getServerSession(authOptions);
  const parse = PostBody.safeParse(await req.json());
  if (!parse.success) return NextResponse.json({ error: "validation_failed" }, { status: 400 });

  const { name, payload } = parse.data;
  const headers = req.headers;
  const ip = headers.get("x-forwarded-for") ?? headers.get("x-real-ip") ?? "unknown";
  const ipHash = createHash("sha256").update(ip).digest("hex").slice(0, 16);
  const userAgent = headers.get("user-agent") ?? null;

  await prisma.trackingEvent.create({
    data: {
      userId: session?.user?.id ?? null,
      name,
      payload: payload ? (payload as object) : undefined,
      ipHash,
      userAgent,
    },
  });

  return NextResponse.json({ ok: true }, { status: 201 });
}
