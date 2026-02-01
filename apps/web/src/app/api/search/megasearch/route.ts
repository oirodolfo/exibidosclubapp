/**
 * GET /api/search/megasearch — instant search, light index.
 * Delegates to search domain controller; no business logic here.
 */

import { NextResponse } from "next/server";
import { megasearch } from "@/search/controllers/megasearch.controller";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q") ?? "";

  const result = await megasearch({ q });

  if (!result.ok) {
    return NextResponse.json(
      { error: result.error },
      { status: result.status }
    );
  }

  return NextResponse.json(result.data);
}
