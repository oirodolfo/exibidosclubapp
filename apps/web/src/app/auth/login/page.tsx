"use client";

import { useState, useEffect, Suspense } from "react";
import { signIn, getProviders } from "next-auth/react";
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
  const [oauthProviders, setOauthProviders] = useState<Record<string, { id: string; name: string }> | null>(null);
  const params = useSearchParams();
  const registered = params.get("registered") === "1";
  const callbackUrl = params.get("callbackUrl") ?? "/";

  useEffect(() => {
    getProviders().then((providers) => {
      if (!providers) return;
      const rest = Object.fromEntries(Object.entries(providers).filter(([k]) => k !== "credentials"));

      if (Object.keys(rest).length > 0) setOauthProviders(rest);
    });
  }, []);

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

  const socialLinks: { id: string; label: string }[] = [];

  if (oauthProviders?.google) socialLinks.push({ id: "google", label: "Google" });

  if (oauthProviders?.twitter) socialLinks.push({ id: "twitter", label: "Twitter/X" });

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
      {socialLinks.length > 0 && (
        <p className="mt-4">
          Or sign in with:{" "}
          {socialLinks.map(({ id, label }, i) => (
            <span key={id}>
              {i > 0 && " · "}
              <a href={`/api/auth/signin/${id}?callbackUrl=${encodeURIComponent(callbackUrl)}`} className={linkCls}>{label}</a>
            </span>
          ))}
        </p>
      )}
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
