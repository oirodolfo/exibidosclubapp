/**
 * exibidos.club — Full seed (Stage 20).
 * Creates seed users, images, categories, tags, badges, groups.
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const SEED_EMAIL = "seed@exibidos.club";
const SEED_SLUG = "seed";
const SEED_BIRTHDATE = new Date("1990-01-01");
const SEED2_EMAIL = "creator@exibidos.club";
const SEED2_SLUG = "creator";

async function main() {
  const user = await prisma.user.upsert({
    where: { email: SEED_EMAIL },
    create: {
      email: SEED_EMAIL,
      name: "Seed User",
      birthdate: SEED_BIRTHDATE,
      role: "user",
    },
    update: {},
  });

  await prisma.slug.upsert({
    where: { userId: user.id },
    create: { userId: user.id, slug: SEED_SLUG },
    update: {},
  });

  const existing = await prisma.image.findFirst({
    where: { userId: user.id, contentHash: "seed-content-hash", deletedAt: null },
  });
  if (!existing) {
    await prisma.image.create({
      data: {
        userId: user.id,
        storageKey: `seed/${user.id}/seed-img/original.jpg`,
        thumbKey: `seed/${user.id}/seed-img/thumb.jpg`,
        blurKey: `seed/${user.id}/seed-img/blur.jpg`,
        mimeType: "image/jpeg",
        visibility: "public",
        moderationStatus: "pending",
        contentHash: "seed-content-hash",
        caption: "Seed image (Stage 6 schema: contentHash)",
      },
    });
  }

  // Stage 9: Categories and tags for tagging/voting
  const catStyle = await prisma.category.upsert({
    where: { slug: "style" },
    create: { name: "Style", slug: "style", sortOrder: 0 },
    update: {},
  });
  const catGenre = await prisma.category.upsert({
    where: { slug: "genre" },
    create: { name: "Genre", slug: "genre", sortOrder: 1 },
    update: {},
  });
  // Stage 12: Badges
  await prisma.badge.upsert({ where: { key: "first_upload" }, create: { key: "first_upload", name: "First Upload", description: "Uploaded your first image" }, update: {} });
  await prisma.badge.upsert({ where: { key: "creator_10" }, create: { key: "creator_10", name: "Creator", description: "10 images uploaded" }, update: {} });
  await prisma.badge.upsert({ where: { key: "top_weekly" }, create: { key: "top_weekly", name: "Top Weekly", description: "In top 10 for the week" }, update: {} });

  // Stage 14: Groups
  {
    await prisma.group.upsert({
      where: { slug: "portrait-lovers" },
      create: { categoryId: catStyle.id, name: "Portrait Lovers", slug: "portrait-lovers" },
      update: {},
    });
  }

  for (const t of [
    { cat: catStyle, slug: "portrait", name: "Portrait" },
    { cat: catStyle, slug: "landscape", name: "Landscape" },
    { cat: catStyle, slug: "abstract", name: "Abstract" },
    { cat: catGenre, slug: "art", name: "Art" },
    { cat: catGenre, slug: "photo", name: "Photo" },
  ]) {
    await prisma.tag.upsert({
      where: { categoryId_slug: { categoryId: t.cat.id, slug: t.slug } },
      create: { categoryId: t.cat.id, name: t.name, slug: t.slug },
      update: {},
    });
  }

  // Stage 20: Second user (creator)
  const creator = await prisma.user.upsert({
    where: { email: SEED2_EMAIL },
    create: {
      email: SEED2_EMAIL,
      name: "Creator User",
      birthdate: SEED_BIRTHDATE,
      role: "creator",
    },
    update: {},
  });
  await prisma.slug.upsert({
    where: { userId: creator.id },
    create: { userId: creator.id, slug: SEED2_SLUG },
    update: {},
  });
  await prisma.profile.upsert({
    where: { userId: creator.id },
    create: { userId: creator.id, displayName: "Creator", bio: "A creator on exibidos.club" },
    update: {},
  });

  // Stage 19: Feature flags (DB entries for when env not set)
  for (const f of [
    { key: "tagging", enabled: false },
    { key: "swipe", enabled: false },
    { key: "rankings", enabled: false },
    { key: "messaging", enabled: false },
    { key: "groups", enabled: false },
  ]) {
    await prisma.featureFlag.upsert({
      where: { key: f.key },
      create: { key: f.key, enabled: f.enabled },
      update: {},
    });
  }

  const existingImg = await prisma.image.findFirst({
    where: { userId: creator.id, deletedAt: null },
  });
  if (!existingImg) {
    await prisma.image.create({
      data: {
        userId: creator.id,
        storageKey: `seed/${creator.id}/img1/original.jpg`,
        thumbKey: `seed/${creator.id}/img1/thumb.jpg`,
        blurKey: `seed/${creator.id}/img1/blur.jpg`,
        mimeType: "image/jpeg",
        visibility: "public",
        moderationStatus: "approved",
        contentHash: `creator-hash-${creator.id}`,
        caption: "Creator seed image",
      },
    });
  }

  console.log("Seed complete (Users, Image, Categories, Tags, Badges, Groups).");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
