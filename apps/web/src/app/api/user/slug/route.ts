import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { prisma } from "@exibidos/db/client";
import { authOptions } from "@/lib/auth/config";
import { SLUG_REGEX } from "@/lib/auth/config";

const Body = z.object({
  newSlug: z.string().min(1).max(30).toLowerCase().refine((s) => SLUG_REGEX.test(s), "invalid slug format"),
});

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const parse = Body.safeParse(await req.json());
  if (!parse.success) {
    return NextResponse.json({ error: "validation_failed", details: parse.error.flatten() }, { status: 400 });
  }
  const { newSlug } = parse.data;

  const current = await prisma.slug.findUnique({ where: { userId: session.user.id } });
  if (!current) return NextResponse.json({ error: "no_slug" }, { status: 400 });
  if (current.slug === newSlug) {
    return NextResponse.json({ ok: true, slug: newSlug }, { status: 200 });
  }

  const taken = await prisma.slug.findUnique({ where: { slug: newSlug } });
  if (taken) {
    return NextResponse.json({ error: "slug_taken", message: "This handle is already taken." }, { status: 409 });
  }

  await prisma.$transaction(async (tx) => {
    await tx.slugHistory.create({
      data: { userId: session.user!.id, oldSlug: current.slug, newSlug },
    });
    await tx.slug.update({
      where: { userId: session.user!.id },
      data: { slug: newSlug },
    });
  });

  return NextResponse.json({ ok: true, slug: newSlug }, { status: 200 });
}
