import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Light proxy: does NOT block feed or navigation.
 * Trust backend (API routes) as source of truth for auth and verification.
 * Optionally extend later to protect direct POSTs to upload APIs (already guarded in handlers).
 */
export function proxy(_request: NextRequest) {
  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all paths except static files and _next.
     * Omit API routes from matcher so API auth is handled in route handlers only.
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
