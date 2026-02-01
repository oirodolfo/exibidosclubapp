/**
 * GET /api/search — full search, pagination, filters.
 * Delegates to search domain controller; no business logic here.
 */

import { NextResponse } from "next/server";
import { search } from "@/search/controllers/search.controller";
import type { SearchEntityType } from "@/search/types/search.types";

const VALID_TYPES: SearchEntityType[] = ["profile", "photo", "category", "tag"];

function parseTypes(value: string | null): SearchEntityType[] | undefined {
  if (!value) return undefined;

  const parts = value.split(",").map((s) => s.trim().toLowerCase());

  const filtered = parts.filter((p): p is SearchEntityType =>
    VALID_TYPES.includes(p as SearchEntityType)
  );

  if (filtered.length === 0) return undefined;

  return [...new Set(filtered)];
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q") ?? "";
  const limit = searchParams.get("limit");
  const offset = searchParams.get("offset");
  const typesParam = searchParams.get("types");

  const result = await search({
    q,
    limit: limit != null ? Number(limit) : undefined,
    offset: offset != null ? Number(offset) : undefined,
    types: parseTypes(typesParam),
  });

  if (!result.ok) {
    return NextResponse.json(
      { error: result.error },
      { status: result.status }
    );
  }

  return NextResponse.json(result.data);
}
