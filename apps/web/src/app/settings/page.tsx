"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import {
  link,
  page,
  mainBlock,
  fieldset,
  field,
  fieldLabel,
  blockHint,
  checkboxLabel,
  checkboxLabelLast,
  formRow,
  closeFriendRow,
  listReset,
  text,
  textarea,
} from "@/lib/variants";

type Profile = {
  displayName: string | null;
  bio: string | null;
  isPrivate: boolean;
  overviewPublic: boolean;
  photosPublic: boolean;
  activityPublic: boolean;
  rankingsPublic: boolean;
  badgesPublic: boolean;
  acceptFollowRequestsAlways: boolean;
  acceptMessageRequestsAlways: boolean;
};

export default function SettingsPage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [slug, setSlug] = useState<string | null>(null);
  const [closeFriends, setCloseFriends] = useState<{ slug: string; displayName: string | null }[]>([]);
  const [closeFriendSlug, setCloseFriendSlug] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const router = useRouter();

  useEffect(() => {
    (async () => {
      const [profRes, meRes, cfRes] = await Promise.all([
        fetch("/api/user/profile"),
        fetch("/api/user/me"),
        fetch("/api/close-friends"),
      ]);

      if (profRes.status === 401 || meRes.status === 401) {
        router.replace("/auth/login?callbackUrl=/settings");

        return;
      }

      if (!profRes.ok) {
        setError("Could not load profile.");
        setLoading(false);

        return;
      }
      const p = (await profRes.json()) as Profile;
      const me = (await meRes.json()) as { slug?: string | null };
      const cf = (cfRes.ok ? ((await cfRes.json()) as { closeFriends?: { slug: string | null; displayName: string | null }[] }) : { closeFriends: [] });

      setProfile(p);
      setSlug(me.slug ?? null);
      setCloseFriends((cf.closeFriends ?? []).filter((c): c is { slug: string; displayName: string | null } => c.slug != null).map((c) => ({ slug: c.slug!, displayName: c.displayName })));
      setLoading(false);
    })();
  }, [router]);

  async function addCloseFriend(e: React.FormEvent) {
    e.preventDefault();

    if (!closeFriendSlug.trim()) return;
    const res = await fetch("/api/close-friends", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ slug: closeFriendSlug.trim() }) });

    if (res.ok) {
      setCloseFriendSlug("");
      const r = await fetch("/api/close-friends");
      const d = (await r.json()) as { closeFriends?: { slug: string | null; displayName: string | null }[] };

      setCloseFriends((d.closeFriends ?? []).filter((c): c is { slug: string; displayName: string | null } => c.slug != null).map((c) => ({ slug: c.slug!, displayName: c.displayName })));
    }
  }

  async function removeCloseFriend(s: string) {
    const res = await fetch(`/api/close-friends/${encodeURIComponent(s)}`, { method: "DELETE" });

    if (res.ok) setCloseFriends((prev) => prev.filter((c) => c.slug !== s));
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (!profile) return;
    setError(null);
    setSuccess(false);
    setSaving(true);

    try {
      const res = await fetch("/api/user/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(profile),
      });

      if (!res.ok) {
        const d = await res.json().catch(() => ({}));

        setError((d as { message?: string }).message ?? "Failed to save.");
        setSaving(false);

        return;
      }
      setSuccess(true);
    } catch {
      setError("Something went wrong.");
    }
    setSaving(false);
  }

  if (loading) return <main className={mainBlock}>Loading…</main>;

  if (!profile) return <main className={mainBlock}>Not found.</main>;

  return (
    <main className={page.default}>
      <h1>Profile &amp; privacy</h1>
      {slug && <p><Link href={`/${slug}`} className={link}>Back to your profile</Link></p>}
      <p>
        <Link href="/upload" className={link}>Upload</Link>
        {" · "}
        <Link href="/follow/requests" className={link}>Follow requests</Link>
      </p>
      {error && <p className={text.error}>{error}</p>}
      {success && <p className={text.success}>Saved.</p>}

      <form onSubmit={onSubmit}>
        <fieldset className={fieldset}>
          <legend>Profile</legend>
          <div className={field}>
            <label htmlFor="displayName" className={fieldLabel}>Display name</label>
            <Input
              id="displayName"
              value={profile.displayName ?? ""}
              onChange={(e) => setProfile((p) => p ? { ...p, displayName: e.target.value || null } : p)}
            />
          </div>
          <div className={field}>
            <label htmlFor="bio" className={fieldLabel}>Bio</label>
            <textarea
              id="bio"
              rows={3}
              className={textarea}
              value={profile.bio ?? ""}
              onChange={(e) => setProfile((p) => p ? { ...p, bio: e.target.value || null } : p)}
            />
          </div>
        </fieldset>

        <fieldset className={fieldset}>
          <legend>Privacy</legend>
          <label className={checkboxLabel}>
            <input
              type="checkbox"
              checked={profile.isPrivate}
              onChange={(e) => setProfile((p) => p ? { ...p, isPrivate: e.target.checked } : p)}
            />
            Private profile (only followers see your content)
          </label>
          <p className={blockHint}>Section visibility (for non-followers when profile is public):</p>
          {(["overviewPublic", "photosPublic", "activityPublic", "rankingsPublic", "badgesPublic"] as const).map((k) => (
            <label key={k} className={checkboxLabel}>
              <input
                type="checkbox"
                checked={profile[k]}
                onChange={(e) => setProfile((p) => p ? { ...p, [k]: e.target.checked } : p)}
              />
              {k.replace(/Public$/, " public")}
            </label>
          ))}
        </fieldset>

        <fieldset className={fieldset}>
          <legend>Close friends</legend>
          <div className={formRow} role="group" aria-label="Add close friend">
            <Input
              value={closeFriendSlug}
              onChange={(e) => setCloseFriendSlug(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addCloseFriend(e as unknown as React.FormEvent);
                }
              }}
              placeholder="Handle (slug)"
              className="flex-1"
            />
            <Button type="button" onClick={() => addCloseFriend({ preventDefault: () => {} } as React.FormEvent)}>
              Add
            </Button>
          </div>
          <ul className={listReset}>
            {closeFriends.map((c) => (
              <li key={c.slug} className={closeFriendRow}>
                <Link href={`/${c.slug}`} className={link}>{c.displayName ?? c.slug}</Link>
                <Button type="button" variant="ghost" size="sm" onClick={() => removeCloseFriend(c.slug)}>Remove</Button>
              </li>
            ))}
          </ul>
        </fieldset>

        <fieldset className={fieldset}>
          <legend>Accept always</legend>
          <label className={checkboxLabel}>
            <input
              type="checkbox"
              checked={profile.acceptFollowRequestsAlways}
              onChange={(e) => setProfile((p) => p ? { ...p, acceptFollowRequestsAlways: e.target.checked } : p)}
            />
            Auto-accept follow requests
          </label>
          <label className={checkboxLabelLast}>
            <input
              type="checkbox"
              checked={profile.acceptMessageRequestsAlways}
              onChange={(e) => setProfile((p) => p ? { ...p, acceptMessageRequestsAlways: e.target.checked } : p)}
            />
            Auto-accept message requests
          </label>
        </fieldset>

        <Button type="submit" disabled={saving}>{saving ? "Saving…" : "Save"}</Button>
      </form>
    </main>
  );
}
