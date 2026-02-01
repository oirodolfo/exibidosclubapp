/**
 * Award badges to users based on achievements.
 * Called on relevant events (upload, swipe like, etc.).
 * Feed ranking: compute and cache rankingScore on Image for feed ordering.
 */

import { prisma } from "@exibidos/db/client";

/** Compute ranking score from likes (swipes), comments, votes, recency. No new tables. */
export async function updateImageRankingScore(imageId: string): Promise<void> {
  const [image, likeCount, commentCount, voteSum] = await Promise.all([
    prisma.image.findUnique({
      where: { id: imageId },
      select: { createdAt: true },
    }),
    prisma.swipe.count({ where: { imageId, direction: "like" } }),
    prisma.comment.count({ where: { imageId, deletedAt: null } }),
    prisma.vote.aggregate({ where: { imageId }, _sum: { weight: true } }),
  ]);

  if (!image) return;

  const likes = likeCount;
  const comments = commentCount;
  const votes = voteSum._sum.weight ?? 0;
  const hoursSinceCreated = (Date.now() - image.createdAt.getTime()) / (1000 * 60 * 60);
  const recencyBonus = Math.max(0, 100 - hoursSinceCreated);

  const score = likes * 2 + comments * 1.5 + votes * 0.3 + recencyBonus;

  await prisma.image.update({
    where: { id: imageId },
    data: { rankingScore: score },
  });
}

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
