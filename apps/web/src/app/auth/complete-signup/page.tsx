"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { page, field, fieldLabel, text } from "@/lib/variants";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

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

  if (checking) return <main className="p-4">Loading…</main>;

  return (
    <main className={page.narrow}>
      <h1 className="text-xl font-semibold">Complete your profile</h1>
      <p className="mt-1 text-sm text-neutral-600">Choose your handle and confirm your birth date (18+). Your URL: exibidos.club/<strong>{slug || "your-handle"}</strong></p>
      {error && <p className={text.error}>{error}</p>}
      <form onSubmit={onSubmit} className="mt-4">
        <div className={field}>
          <label htmlFor="birthdate" className={fieldLabel}>Birth date (18+)</label>
          <Input id="birthdate" type="date" value={birthdate} onChange={(e) => setBirthdate(e.target.value)} required />
        </div>
        <div className={field}>
          <label htmlFor="slug" className={fieldLabel}>Handle</label>
          <Input id="slug" type="text" value={slug} onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))} required minLength={1} maxLength={30} placeholder="your-handle" />
        </div>
        <Button type="submit" disabled={loading}>{loading ? "Saving…" : "Continue"}</Button>
      </form>
    </main>
  );
}
