import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { prisma } from "@exibidos/db/client";
import { authOptions, isAgeAllowed, SLUG_REGEX } from "@/lib/auth/config";

const Body = z.object({
  birthdate: z.string().datetime({ offset: true }).or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)).transform((s) => new Date(s)),
  slug: z.string().min(1).max(30).toLowerCase().refine((s) => SLUG_REGEX.test(s), "invalid slug format"),
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
  const { birthdate, slug } = parse.data;

  if (!isAgeAllowed(birthdate)) {
    return NextResponse.json({ error: "age_gate", message: "You must be at least 18." }, { status: 403 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id, deletedAt: null },
    include: { slugs: true, profile: true },
  });
  if (!user) return NextResponse.json({ error: "not_found" }, { status: 404 });
  if (user.slugs.length > 0) {
    return NextResponse.json({ ok: true, slug: user.slugs[0]!.slug }, { status: 200 });
  }

  const taken = await prisma.slug.findUnique({ where: { slug } });
  if (taken) {
    return NextResponse.json({ error: "slug_taken", message: "This handle is already taken." }, { status: 409 });
  }

  await prisma.$transaction(async (tx) => {
    await tx.user.update({
      where: { id: session.user!.id },
      data: { birthdate },
    });
    if (!user.profile) {
      await tx.profile.create({ data: { userId: session.user!.id } });
    }
    await tx.slug.create({ data: { userId: session.user!.id, slug } });
  });

  return NextResponse.json({ ok: true, slug }, { status: 200 });
}
