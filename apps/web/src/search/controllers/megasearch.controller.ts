/**
 * MegaSearch controller: parses input, delegates to service, returns DTO.
 * No Next.js / req-res; migration-ready for NestJS.
 */

import { SEARCH_CONFIG } from "../config/search.config";
import { runMegaSearch } from "../services/search.service";
import type { MegaSearchResponseDto } from "../dto/megasearch.dto";

const { megasearch: megasearchConfig } = SEARCH_CONFIG;

export interface MegaSearchControllerInput {
  q: string;
}

/** MegaSearch: instant search, light index, max 3–4 per type. */
export async function megasearch(
  input: MegaSearchControllerInput
): Promise<{ ok: true; data: MegaSearchResponseDto } | { ok: false; error: string; status: number }> {
  const q = (input.q ?? "").trim();

  if (q.length < megasearchConfig.minQueryLength) {
    return { ok: false, error: "query_too_short", status: 400 };
  }

  if (q.length > megasearchConfig.maxQueryLength) {
    return { ok: false, error: "query_too_long", status: 400 };
  }

  const data = await runMegaSearch(q);

  return { ok: true, data };
}
