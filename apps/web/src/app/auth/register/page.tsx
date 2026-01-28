"use client";

import { useState } from "react";
import Link from "next/link";
import { page, field, fieldLabel, text, link as linkCls, fieldHint } from "@/lib/variants";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

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
    <main className={page.narrow}>
      <h1 className="text-xl font-semibold">Create an account</h1>
      <p className="mt-1 text-sm text-neutral-600">You must be 18 or older. Your handle will be your public URL: exibidos.club/<strong>{slug || "your-handle"}</strong></p>
      {error && <p className={text.error}>{error}</p>}
      <form onSubmit={onSubmit} className="mt-4">
        <div className={field}>
          <label htmlFor="email" className={fieldLabel}>Email</label>
          <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" />
        </div>
        <div className={field}>
          <label htmlFor="password" className={fieldLabel}>Password (min 8)</label>
          <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={8} autoComplete="new-password" />
        </div>
        <div className={field}>
          <label htmlFor="birthdate" className={fieldLabel}>Birth date (18+)</label>
          <Input id="birthdate" type="date" value={birthdate} onChange={(e) => setBirthdate(e.target.value)} required />
        </div>
        <div className={field}>
          <label htmlFor="slug" className={fieldLabel}>Handle (exibidos.club/…)</label>
          <Input id="slug" type="text" value={slug} onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))} required minLength={1} maxLength={30} placeholder="your-handle" />
          <p className={fieldHint}>Letters, numbers, hyphens only. 1–30 chars.</p>
        </div>
        <Button type="submit" disabled={loading} className="mr-2">{loading ? "Creating…" : "Create account"}</Button>
      </form>
      <p className="mt-4">Already have an account? <Link href="/auth/login" className={linkCls}>Log in</Link></p>
    </main>
  );
}
