/**
 * Search domain — public API.
 * Controllers, services, DTOs and types are framework-agnostic; migration-ready for NestJS.
 */

export { megasearch } from "./controllers/megasearch.controller";
export { search } from "./controllers/search.controller";
export { runMegaSearch, runFullSearch, invalidateSearchCache } from "./services/search.service";
export { SEARCH_CONFIG } from "./config/search.config";
export type { MegaSearchQueryDto, MegaSearchResponseDto } from "./dto/megasearch.dto";
export type { SearchQueryDto, SearchResponseDto } from "./dto/search.dto";
export type { SearchEntityType, SearchMatch, MegaSearchResult, FullSearchResult, SearchInput, MegaSearchInput } from "./types/search.types";
