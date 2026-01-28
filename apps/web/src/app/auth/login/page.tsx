"use client";

import { useState, Suspense } from "react";
import { signIn } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { page, field, fieldLabel, text, link as linkCls } from "@/lib/variants";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const params = useSearchParams();
  const registered = params.get("registered") === "1";
  const callbackUrl = params.get("callbackUrl") ?? "/";

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const res = await signIn("credentials", { email, password, redirect: false, callbackUrl });
    setLoading(false);
    if (res?.error) {
      setError("Invalid email or password.");
      return;
    }
    if (res?.ok && res?.url) {
      window.location.href = res.url;
      return;
    }
  }

  return (
    <main className={page.narrow}>
      <h1 className="text-xl font-semibold">Log in</h1>
      {registered && <p className={text.success}>Account created. You can log in now.</p>}
      {error && <p className={text.error}>{error}</p>}
      <form onSubmit={onSubmit} className="mt-4">
        <div className={field}>
          <label htmlFor="email" className={fieldLabel}>Email</label>
          <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" />
        </div>
        <div className={field}>
          <label htmlFor="password" className={fieldLabel}>Password</label>
          <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required autoComplete="current-password" />
        </div>
        <Button type="submit" disabled={loading} className="mr-2">{loading ? "Signing in…" : "Sign in"}</Button>
      </form>
      <p className="mt-4">
        Or sign in with:{" "}
        <a href={`/api/auth/signin/google?callbackUrl=${encodeURIComponent(callbackUrl)}`} className={linkCls}>Google</a>
        {" · "}
        <a href={`/api/auth/signin/twitter?callbackUrl=${encodeURIComponent(callbackUrl)}`} className={linkCls}>Twitter/X</a>
      </p>
      <p className="mt-4">
        Don&apos;t have an account? <Link href="/auth/register" className={linkCls}>Register</Link>
      </p>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<main className="p-4">Loading…</main>}>
      <LoginForm />
    </Suspense>
  );
}
