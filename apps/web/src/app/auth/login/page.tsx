"use client";

import { useState, Suspense } from "react";
import { signIn } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";

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
    <main style={{ maxWidth: 360, margin: "2rem auto", padding: "0 1rem" }}>
      <h1>Log in</h1>
      {registered && <p style={{ color: "green" }}>Account created. You can log in now.</p>}
      {error && <p style={{ color: "red" }}>{error}</p>}
      <form onSubmit={onSubmit}>
        <div style={{ marginBottom: "0.75rem" }}>
          <label htmlFor="email">Email</label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
            style={{ display: "block", width: "100%", padding: "0.5rem" }}
          />
        </div>
        <div style={{ marginBottom: "0.75rem" }}>
          <label htmlFor="password">Password</label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="current-password"
            style={{ display: "block", width: "100%", padding: "0.5rem" }}
          />
        </div>
        <button type="submit" disabled={loading} style={{ padding: "0.5rem 1rem", marginRight: "0.5rem" }}>
          {loading ? "Signing in…" : "Sign in"}
        </button>
      </form>
      <p style={{ marginTop: "1rem" }}>
        Or sign in with:{" "}
        <a href={`/api/auth/signin/google?callbackUrl=${encodeURIComponent(callbackUrl)}`}>Google</a>
        {" · "}
        <a href={`/api/auth/signin/twitter?callbackUrl=${encodeURIComponent(callbackUrl)}`}>Twitter/X</a>
      </p>
      <p style={{ marginTop: "1rem" }}>
        Don&apos;t have an account? <Link href="/auth/register">Register</Link>
      </p>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<main style={{ padding: "1rem" }}>Loading…</main>}>
      <LoginForm />
    </Suspense>
  );
}
