/**
 * Full search controller: parses input, delegates to service, returns DTO.
 * No Next.js / req-res; migration-ready for NestJS.
 */

import { SEARCH_CONFIG } from "../config/search.config";
import { runFullSearch } from "../services/search.service";
import type { SearchResponseDto } from "../dto/search.dto";
import type { SearchEntityType } from "../types/search.types";

const { megasearch: megasearchConfig, fullSearch: fullSearchConfig } = SEARCH_CONFIG;

export interface SearchControllerInput {
  q: string;
  limit?: number;
  offset?: number;
  types?: SearchEntityType[];
}

/** Full search: full index, pagination, filters. */
export async function search(
  input: SearchControllerInput
): Promise<{ ok: true; data: SearchResponseDto } | { ok: false; error: string; status: number }> {
  const q = (input.q ?? "").trim();

  if (q.length < megasearchConfig.minQueryLength) {
    return { ok: false, error: "query_too_short", status: 400 };
  }

  if (q.length > megasearchConfig.maxQueryLength) {
    return { ok: false, error: "query_too_long", status: 400 };
  }

  const limit = input.limit != null ? Math.min(input.limit, fullSearchConfig.maxLimit) : fullSearchConfig.defaultLimit;
  const offset = input.offset ?? fullSearchConfig.defaultOffset;
  const types = input.types;

  const data = await runFullSearch({ q, limit, offset, types });

  return { ok: true, data };
}
