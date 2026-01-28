"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function CompleteSignupPage() {
  const [birthdate, setBirthdate] = useState("");
  const [slug, setSlug] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);
  const router = useRouter();

  useEffect(() => {
    (async () => {
      const res = await fetch("/api/auth/session");
      const data = await res.json();
      if (!data?.user?.id) {
        router.replace("/auth/login");
        return;
      }
      setChecking(false);
    })();
  }, [router]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/auth/complete-signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ birthdate: birthdate || undefined, slug: slug.toLowerCase().trim() }),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string; message?: string; slug?: string };
      if (!res.ok) {
        setError(data.message ?? data.error ?? "Failed.");
        setLoading(false);
        return;
      }
      router.replace(`/${data.slug ?? ""}`);
    } catch {
      setError("Something went wrong.");
      setLoading(false);
    }
  }

  if (checking) return <p>Loading…</p>;

  return (
    <main style={{ maxWidth: 360, margin: "2rem auto", padding: "0 1rem" }}>
      <h1>Complete your profile</h1>
      <p>Choose your handle and confirm your birth date (18+). Your URL: exibidos.club/<strong>{slug || "your-handle"}</strong></p>
      {error && <p style={{ color: "red" }}>{error}</p>}
      <form onSubmit={onSubmit}>
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
          <label htmlFor="slug">Handle</label>
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
        </div>
        <button type="submit" disabled={loading} style={{ padding: "0.5rem 1rem" }}>
          {loading ? "Saving…" : "Continue"}
        </button>
      </form>
    </main>
  );
}
