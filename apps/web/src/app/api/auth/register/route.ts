import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@exibidos/db/client";
import { isAgeAllowed, SLUG_REGEX } from "@/lib/auth/config";

const Body = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(256),
  birthdate: z.string().datetime({ offset: true }).or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)).transform((s) => new Date(s)),
  slug: z.string().min(1).max(30).toLowerCase().refine((s) => SLUG_REGEX.test(s), "slug must be 1–30 chars, lowercase letters, numbers, hyphens; cannot start/end with hyphen"),
});

export async function POST(req: Request) {
  const parse = Body.safeParse(await req.json());

  if (!parse.success) {
    return NextResponse.json({ error: "validation_failed", details: parse.error.flatten() }, { status: 400 });
  }
  const { email, password, birthdate, slug } = parse.data;

  if (!isAgeAllowed(birthdate)) {
    return NextResponse.json({ error: "age_gate", message: "You must be at least 18 to register." }, { status: 403 });
  }

  const existing = await prisma.user.findFirst({ where: { email, deletedAt: null } });

  if (existing) {
    return NextResponse.json({ error: "email_taken", message: "An account with this email already exists." }, { status: 409 });
  }

  const slugRow = await prisma.slug.findUnique({ where: { slug } });

  if (slugRow) {
    return NextResponse.json({ error: "slug_taken", message: "This handle is already taken." }, { status: 409 });
  }

  const passwordHash = await bcrypt.hash(password, 12);

  await prisma.$transaction(async (tx) => {
    const user = await tx.user.create({
      data: {
        email,
        emailVerified: null,
        passwordHash,
        name: null,
        image: null,
        birthdate,
        role: "user",
      },
    });

    await tx.profile.create({ data: { userId: user.id } });
    await tx.slug.create({ data: { userId: user.id, slug } });
  });

  return NextResponse.json({ ok: true }, { status: 201 });
}
