/**
 * Search repository: Prisma queries for light (MegaSearch) and full index.
 * Framework-agnostic; migration-ready for NestJS.
 */

import { prisma } from "@exibidos/db/client";

const MEGASEARCH_MAX_PER_TYPE = 4;

export interface LightProfileHit {
  id: string;
  slug: string;
  displayName: string | null;
}

export interface LightPhotoHit {
  id: string;
  caption: string | null;
  slug: string;
  thumbKey: string | null;
}

export interface LightCategoryHit {
  id: string;
  name: string;
  slug: string;
}

export interface LightTagHit {
  id: string;
  name: string;
  slug: string;
  categoryId: string;
}

export interface FullProfileHit extends LightProfileHit {
  bio: string | null;
}

export interface FullPhotoHit extends LightPhotoHit {}

export interface FullCategoryHit extends LightCategoryHit {
  description: string | null;
}

export interface FullTagHit extends LightTagHit {}

/** Normalize query for prefix/contains: trim, lowercase, limit length */
export function normalizeQuery(q: string, maxLen: number): string {
  return q.trim().toLowerCase().slice(0, maxLen);
}

/** Light index: username, profile name, photo caption, tags, category name. Prefix + contains. */
export async function searchLight(
  normalizedQuery: string,
  maxPerType: number = MEGASEARCH_MAX_PER_TYPE
): Promise<{
  profiles: LightProfileHit[];
  photos: LightPhotoHit[];
  categories: LightCategoryHit[];
  tags: LightTagHit[];
}> {
  const [profileRows, photoRows, categories, tags] = await Promise.all([
    prisma.slug.findMany({
      where: {
        user: { deletedAt: null },
        OR: [
          { slug: { startsWith: normalizedQuery, mode: "insensitive" } },
          {
            user: {
              profile: {
                displayName: { contains: normalizedQuery, mode: "insensitive" },
              },
            },
          },
        ],
      },
      select: {
        userId: true,
        slug: true,
        user: { select: { profile: { select: { displayName: true } } } },
      },
      take: maxPerType * 2,
    }),

    prisma.image.findMany({
      where: {
        deletedAt: null,
        visibility: "public",
        moderationStatus: "approved",
        OR: [
          { caption: { contains: normalizedQuery, mode: "insensitive" } },
          {
            imageTags: {
              some: {
                tag: {
                  name: { contains: normalizedQuery, mode: "insensitive" },
                },
              },
            },
          },
        ],
      },
      select: {
        id: true,
        caption: true,
        thumbKey: true,
        user: { select: { slugs: { take: 1, select: { slug: true } } } },
      },
      take: maxPerType * 2,
      orderBy: { createdAt: "desc" },
    }),

    prisma.category.findMany({
      where: {
        name: { contains: normalizedQuery, mode: "insensitive" },
      },
      select: { id: true, name: true, slug: true },
      take: maxPerType,
    }),

    prisma.tag.findMany({
      where: {
        name: { contains: normalizedQuery, mode: "insensitive" },
      },
      select: { id: true, name: true, slug: true, categoryId: true },
      take: maxPerType,
    }),
  ]);

  const profiles: LightProfileHit[] = profileRows.slice(0, maxPerType).map((s) => ({
    id: s.userId,
    slug: s.slug,
    displayName: s.user?.profile?.displayName ?? null,
  }));

  const photos: LightPhotoHit[] = photoRows.slice(0, maxPerType).map((img) => ({
    id: img.id,
    caption: img.caption,
    slug: img.user?.slugs?.[0]?.slug ?? "",
    thumbKey: img.thumbKey,
  }));

  return { profiles, photos, categories, tags };
}

/** Full index: same as light + bio, description; pagination. */
export async function searchFull(
  normalizedQuery: string,
  options: { limit: number; offset: number; types?: ("profile" | "photo" | "category" | "tag")[] }
): Promise<{
  profiles: FullProfileHit[];
  photos: FullPhotoHit[];
  categories: FullCategoryHit[];
  tags: FullTagHit[];
  total: { profiles: number; photos: number; categories: number; tags: number };
}> {
  const { limit, offset, types = ["profile", "photo", "category", "tag"] } = options;

  const runProfiles = types.includes("profile");
  const runPhotos = types.includes("photo");
  const runCategories = types.includes("category");
  const runTags = types.includes("tag");

  const [profileRows, photoRows, categoriesRows, tagsRows, counts] = await Promise.all([
    runProfiles
      ? prisma.slug.findMany({
          where: {
            user: { deletedAt: null },
            OR: [
              { slug: { contains: normalizedQuery, mode: "insensitive" } },
              {
                user: {
                  profile: {
                    OR: [
                      { displayName: { contains: normalizedQuery, mode: "insensitive" } },
                      { bio: { contains: normalizedQuery, mode: "insensitive" } },
                    ],
                  },
                },
              },
            ],
          },
          select: {
            userId: true,
            slug: true,
            user: { select: { profile: { select: { displayName: true, bio: true } } } },
          },
          take: limit + 1,
          skip: offset,
        })
      : Promise.resolve([]),

    runPhotos
      ? prisma.image.findMany({
          where: {
            deletedAt: null,
            visibility: "public",
            moderationStatus: "approved",
            OR: [
              { caption: { contains: normalizedQuery, mode: "insensitive" } },
              {
                imageTags: {
                  some: {
                    tag: { name: { contains: normalizedQuery, mode: "insensitive" } },
                  },
                },
              },
            ],
          },
          select: {
            id: true,
            caption: true,
            thumbKey: true,
            user: { select: { slugs: { take: 1, select: { slug: true } } } },
          },
          take: limit + 1,
          skip: offset,
          orderBy: { createdAt: "desc" },
        })
      : Promise.resolve([]),

    runCategories
      ? prisma.category.findMany({
          where: {
            OR: [
              { name: { contains: normalizedQuery, mode: "insensitive" } },
              { description: { contains: normalizedQuery, mode: "insensitive" } },
            ],
          },
          select: { id: true, name: true, slug: true, description: true },
          take: limit + 1,
          skip: offset,
        })
      : Promise.resolve([]),

    runTags
      ? prisma.tag.findMany({
          where: { name: { contains: normalizedQuery, mode: "insensitive" } },
          select: { id: true, name: true, slug: true, categoryId: true },
          take: limit + 1,
          skip: offset,
        })
      : Promise.resolve([]),

    Promise.all([
      runProfiles
        ? prisma.slug.count({
            where: {
              user: { deletedAt: null },
              OR: [
                { slug: { contains: normalizedQuery, mode: "insensitive" } },
                {
                  user: {
                    profile: {
                      OR: [
                        { displayName: { contains: normalizedQuery, mode: "insensitive" } },
                        { bio: { contains: normalizedQuery, mode: "insensitive" } },
                      ],
                    },
                  },
                },
              ],
            },
          })
        : 0,
      runPhotos
        ? prisma.image.count({
            where: {
              deletedAt: null,
              visibility: "public",
              moderationStatus: "approved",
              OR: [
                { caption: { contains: normalizedQuery, mode: "insensitive" } },
                {
                  imageTags: {
                    some: {
                      tag: { name: { contains: normalizedQuery, mode: "insensitive" } },
                    },
                  },
                },
              ],
            },
          })
        : 0,
      runCategories
        ? prisma.category.count({
            where: {
              OR: [
                { name: { contains: normalizedQuery, mode: "insensitive" } },
                { description: { contains: normalizedQuery, mode: "insensitive" } },
              ],
            },
          })
        : 0,
      runTags
        ? prisma.tag.count({
            where: { name: { contains: normalizedQuery, mode: "insensitive" } },
          })
        : 0,
    ]),
  ]);

  const [profilesCount, photosCount, categoriesCount, tagsCount] = counts;

  const profiles: FullProfileHit[] = profileRows.slice(0, limit).map((s) => ({
    id: s.userId,
    slug: s.slug,
    displayName: s.user?.profile?.displayName ?? null,
    bio: s.user?.profile?.bio ?? null,
  }));

  const photos: FullPhotoHit[] = photoRows.slice(0, limit).map((img) => ({
    id: img.id,
    caption: img.caption,
    slug: img.user?.slugs?.[0]?.slug ?? "",
    thumbKey: img.thumbKey,
  }));

  const categories: FullCategoryHit[] = categoriesRows.slice(0, limit).map((c) => ({
    id: c.id,
    name: c.name,
    slug: c.slug,
    description: c.description,
  }));

  const tags: FullTagHit[] = tagsRows.slice(0, limit).map((t) => ({
    id: t.id,
    name: t.name,
    slug: t.slug,
    categoryId: t.categoryId,
  }));

  return {
    profiles,
    photos,
    categories,
    tags,
    total: {
      profiles: typeof profilesCount === "number" ? profilesCount : 0,
      photos: typeof photosCount === "number" ? photosCount : 0,
      categories: typeof categoriesCount === "number" ? categoriesCount : 0,
      tags: typeof tagsCount === "number" ? tagsCount : 0,
    },
  };
}
