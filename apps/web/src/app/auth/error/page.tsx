"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";

function AuthErrorContent() {
  const params = useSearchParams();
  const error = params.get("error") ?? "unknown";

  return (
    <main style={{ maxWidth: 360, margin: "2rem auto", padding: "0 1rem" }}>
      <h1>Sign-in error</h1>
      <p>{error === "OAuthAccountNotLinked" ? "This email is linked to another sign-in method." : `Error: ${error}`}</p>
      <p><Link href="/auth/login">Back to login</Link></p>
    </main>
  );
}

export default function AuthErrorPage() {
  return (
    <Suspense fallback={<main style={{ padding: "1rem" }}>Loading…</main>}>
      <AuthErrorContent />
    </Suspense>
  );
}
