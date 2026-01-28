"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { page, link as linkCls } from "@/lib/variants";

function AuthErrorContent() {
  const params = useSearchParams();
  const error = params.get("error") ?? "unknown";

  return (
    <main className={page.narrow}>
      <h1 className="text-xl font-semibold">Sign-in error</h1>
      <p className="mt-2">{error === "OAuthAccountNotLinked" ? "This email is linked to another sign-in method." : `Error: ${error}`}</p>
      <p className="mt-4"><Link href="/auth/login" className={linkCls}>Back to login</Link></p>
    </main>
  );
}

export default function AuthErrorPage() {
  return (
    <Suspense fallback={<main className="p-4">Loading…</main>}>
      <AuthErrorContent />
    </Suspense>
  );
}
