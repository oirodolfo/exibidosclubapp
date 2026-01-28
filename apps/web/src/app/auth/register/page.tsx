"use client";

import { useState } from "react";
import Link from "next/link";

export default function RegisterPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [birthdate, setBirthdate] = useState("");
  const [slug, setSlug] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, birthdate: birthdate || undefined, slug: slug.toLowerCase().trim() }),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string; message?: string; details?: unknown };
      if (!res.ok) {
        setError(data.message ?? data.error ?? "Registration failed.");
        setLoading(false);
        return;
      }
      window.location.href = "/auth/login?registered=1";
    } catch {
      setError("Something went wrong.");
      setLoading(false);
    }
  }

  return (
    <main style={{ maxWidth: 360, margin: "2rem auto", padding: "0 1rem" }}>
      <h1>Create an account</h1>
      <p>You must be 18 or older. Your handle will be your public URL: exibidos.club/<strong>{slug || "your-handle"}</strong></p>
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
          <label htmlFor="password">Password (min 8)</label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={8}
            autoComplete="new-password"
            style={{ display: "block", width: "100%", padding: "0.5rem" }}
          />
        </div>
        <div style={{ marginBottom: "0.75rem" }}>
          <label htmlFor="birthdate">Birth date (18+)</label>
          <input
            id="birthdate"
            type="date"
            value={birthdate}
            onChange={(e) => setBirthdate(e.target.value)}
            required
            style={{ display: "block", width: "100%", padding: "0.5rem" }}
          />
        </div>
        <div style={{ marginBottom: "0.75rem" }}>
          <label htmlFor="slug">Handle (exibidos.club/…)</label>
          <input
            id="slug"
            type="text"
            value={slug}
            onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))}
            required
            minLength={1}
            maxLength={30}
            placeholder="your-handle"
            style={{ display: "block", width: "100%", padding: "0.5rem" }}
          />
          <small>Letters, numbers, hyphens only. 1–30 chars.</small>
        </div>
        <button type="submit" disabled={loading} style={{ padding: "0.5rem 1rem", marginRight: "0.5rem" }}>
          {loading ? "Creating…" : "Create account"}
        </button>
      </form>
      <p style={{ marginTop: "1rem" }}>
        Already have an account? <Link href="/auth/login">Log in</Link>
      </p>
    </main>
  );
}
