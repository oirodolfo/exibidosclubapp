/**
 * MegaSearch ranking: type weight × field weight × match quality + boosts.
 * Deterministic, fast; no embeddings. Migration-ready for NestJS.
 */

import { SEARCH_CONFIG } from "../config/search.config";
import type { LightProfileHit, LightPhotoHit, LightCategoryHit, LightTagHit } from "../repositories/search.repository";

const { typeWeight, fieldWeight, matchQualityWeight } = SEARCH_CONFIG.ranking;

export type RankedProfile = LightProfileHit & { score: number };
export type RankedPhoto = LightPhotoHit & { score: number };
export type RankedCategory = LightCategoryHit & { score: number };
export type RankedTag = LightTagHit & { score: number };

function normalizeForMatch(str: string | null): string {
  if (!str || typeof str !== "string") return "";

  return str.toLowerCase().trim();
}

/** Classify match quality: prefix exact, word, or fuzzy (contains). */
function matchQuality(query: string, fieldValue: string): "prefix_exact" | "word" | "fuzzy" {
  const q = query.toLowerCase();
  const v = fieldValue.toLowerCase();

  if (v.startsWith(q)) return "prefix_exact";

  const words = v.split(/\s+/);

  if (words.some((w) => w === q || w.startsWith(q))) return "word";

  if (v.includes(q)) return "fuzzy";

  return "fuzzy";
}

function qualityMultiplier(quality: "prefix_exact" | "word" | "fuzzy"): number {
  return matchQualityWeight[quality];
}

/** Score profile: username (slug) x3, displayName x2.5; type 1.0. */
export function rankProfiles(
  query: string,
  profiles: LightProfileHit[],
  maxCount: number
): RankedProfile[] {
  const q = normalizeForMatch(query);
  const scored = profiles.map((p) => {
    const slugMatch = matchQuality(q, p.slug);
    const nameMatch = p.displayName ? matchQuality(q, p.displayName) : null;
    const slugScore = slugMatch ? fieldWeight.username * qualityMultiplier(slugMatch) : 0;
    const nameScore = nameMatch ? fieldWeight.profileName * qualityMultiplier(nameMatch) : 0;
    const base = typeWeight.profile * (slugScore + nameScore || fieldWeight.captionOrDescription * 0.5);
    const score = base; // + optional popularityNorm + recencyDecay

    return { ...p, score };
  });

  scored.sort((a, b) => b.score - a.score);

  return scored.slice(0, maxCount);
}

/** Score photo: caption (title) x2.0; type 0.7. */
export function rankPhotos(query: string, photos: LightPhotoHit[], maxCount: number): RankedPhoto[] {
  const q = normalizeForMatch(query);
  const scored = photos.map((p) => {
    const captionMatch = p.caption ? matchQuality(q, p.caption) : null;
    const base = typeWeight.photo * (captionMatch ? fieldWeight.photoTitle * qualityMultiplier(captionMatch) : fieldWeight.captionOrDescription * 0.5);
    const score = base;

    return { ...p, score };
  });

  scored.sort((a, b) => b.score - a.score);

  return scored.slice(0, maxCount);
}

/** Score category: name x1.8; type 0.6. */
export function rankCategories(
  query: string,
  categories: LightCategoryHit[],
  maxCount: number
): RankedCategory[] {
  const q = normalizeForMatch(query);
  const scored = categories.map((c) => {
    const nameMatch = matchQuality(q, c.name);
    const score = typeWeight.category * fieldWeight.categoryName * qualityMultiplier(nameMatch);

    return { ...c, score };
  });

  scored.sort((a, b) => b.score - a.score);

  return scored.slice(0, maxCount);
}

/** Score tag: name x1.5; type 0.5. */
export function rankTags(query: string, tags: LightTagHit[], maxCount: number): RankedTag[] {
  const q = normalizeForMatch(query);
  const scored = tags.map((t) => {
    const nameMatch = matchQuality(q, t.name);
    const score = typeWeight.tag * fieldWeight.tagName * qualityMultiplier(nameMatch);

    return { ...t, score };
  });

  scored.sort((a, b) => b.score - a.score);

  return scored.slice(0, maxCount);
}
