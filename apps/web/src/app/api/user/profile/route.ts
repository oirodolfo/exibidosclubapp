import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { prisma } from "@exibidos/db/client";
import { authOptions } from "@/lib/auth/config";

const PatchBody = z.object({
  displayName: z.string().min(0).max(100).optional(),
  bio: z.string().max(500).optional().nullable(),
  isPrivate: z.boolean().optional(),
  overviewPublic: z.boolean().optional(),
  photosPublic: z.boolean().optional(),
  activityPublic: z.boolean().optional(),
  rankingsPublic: z.boolean().optional(),
  badgesPublic: z.boolean().optional(),
  acceptFollowRequestsAlways: z.boolean().optional(),
  acceptMessageRequestsAlways: z.boolean().optional(),
});

const profileSelect = {
  displayName: true,
  bio: true,
  isPrivate: true,
  overviewPublic: true,
  photosPublic: true,
  activityPublic: true,
  rankingsPublic: true,
  badgesPublic: true,
  acceptFollowRequestsAlways: true,
  acceptMessageRequestsAlways: true,
} as const;

export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const profile = await prisma.profile.findUnique({
    where: { userId: session.user.id },
    select: profileSelect,
  });

  if (!profile) return NextResponse.json({ error: "not_found" }, { status: 404 });

  return NextResponse.json(profile);
}

export async function PATCH(req: Request) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const parse = PatchBody.safeParse(await req.json());

  if (!parse.success) return NextResponse.json({ error: "validation_failed", details: parse.error.flatten() }, { status: 400 });

  const data = Object.fromEntries(
    Object.entries(parse.data).filter(([, v]) => v !== undefined)
  ) as Record<string, unknown>;

  const profile = await prisma.profile.upsert({
    where: { userId: session.user.id },
    create: { userId: session.user.id, ...data },
    update: data,
  });

  return NextResponse.json(profile);
}
