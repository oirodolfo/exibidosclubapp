/**
 * MegaSearch DTOs. Framework-agnostic; migration-ready for NestJS.
 */

export interface MegaSearchQueryDto {
  /** Search query (prefix / light fuzzy) */
  q: string;
}

export interface MegaSearchProfileDto {
  id: string;
  slug: string;
  displayName: string | null;
}

export interface MegaSearchPhotoDto {
  id: string;
  caption: string | null;
  slug: string;
  thumbKey: string | null;
}

export interface MegaSearchCategoryDto {
  id: string;
  name: string;
  slug: string;
}

export interface MegaSearchTagDto {
  id: string;
  name: string;
  slug: string;
  categoryId: string;
}

export interface MegaSearchResponseDto {
  profiles: MegaSearchProfileDto[];
  photos: MegaSearchPhotoDto[];
  categories: MegaSearchCategoryDto[];
  tags: MegaSearchTagDto[];
}
