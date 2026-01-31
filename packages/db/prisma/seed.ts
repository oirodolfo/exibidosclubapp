/**
 * exibidos.club — Minimal seed (Stage 6+).
 * Stage 20 implements full seed with scenarios and factories.
 * Schema change: Image.contentHash (Stage 6) — seed creates Image with contentHash.
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const SEED_EMAIL = "seed@exibidos.club";
const SEED_SLUG = "seed";
const SEED_BIRTHDATE = new Date("1990-01-01");

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

  console.log("Seed complete (Image, Categories, Tags).");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
