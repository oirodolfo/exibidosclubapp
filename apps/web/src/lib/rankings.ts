/**
 * Award badges to users based on achievements.
 * Called on relevant events (upload, swipe like, etc.).
 */

import { prisma } from "@exibidos/db/client";

const BADGES: { key: string; name: string; description: string }[] = [
  { key: "first_upload", name: "First Upload", description: "Uploaded your first image" },
  { key: "top_weekly", name: "Top Weekly", description: "In top 10 for the week" },
  { key: "creator_10", name: "Creator", description: "10 images uploaded" },
];

export async function ensureBadgesExist(): Promise<void> {
  for (const b of BADGES) {
    await prisma.badge.upsert({
      where: { key: b.key },
      create: b,
      update: { name: b.name, description: b.description },
    });
  }
}

export async function awardFirstUpload(userId: string): Promise<boolean> {
  await ensureBadgesExist();
  const badge = await prisma.badge.findUnique({ where: { key: "first_upload" } });

  if (!badge) return false;
  const existing = await prisma.userBadge.findUnique({
    where: { userId_badgeId: { userId, badgeId: badge.id } },
  });

  if (existing) return false;
  await prisma.userBadge.create({
    data: { userId, badgeId: badge.id },
  });

  return true;
}
