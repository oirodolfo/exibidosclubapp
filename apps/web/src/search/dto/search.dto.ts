/**
 * Full search DTOs. Framework-agnostic; migration-ready for NestJS.
 */

import type { SearchEntityType } from "../types/search.types";

export interface SearchQueryDto {
  q: string;
  limit?: number;
  offset?: number;
  types?: SearchEntityType[];
}

export interface SearchProfileDto {
  id: string;
  slug: string;
  displayName: string | null;
  bio: string | null;
}

export interface SearchPhotoDto {
  id: string;
  caption: string | null;
  slug: string;
  thumbKey: string | null;
}

export interface SearchCategoryDto {
  id: string;
  name: string;
  slug: string;
  description: string | null;
}

export interface SearchTagDto {
  id: string;
  name: string;
  slug: string;
  categoryId: string;
}

export interface SearchResponseDto {
  profiles: SearchProfileDto[];
  photos: SearchPhotoDto[];
  categories: SearchCategoryDto[];
  tags: SearchTagDto[];
  total: {
    profiles: number;
    photos: number;
    categories: number;
    tags: number;
  };
}
