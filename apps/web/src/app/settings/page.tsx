"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

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

  if (loading) return <main style={{ padding: "1rem" }}>Loading…</main>;
  if (!profile) return <main style={{ padding: "1rem" }}>Not found.</main>;

  return (
    <main style={{ maxWidth: 480, margin: "0 auto", padding: "1rem" }}>
      <h1>Profile &amp; privacy</h1>
      {slug && <p><Link href={`/${slug}`}>Back to your profile</Link></p>}
      <p><Link href="/follow/requests">Follow requests</Link></p>
      {error && <p style={{ color: "red" }}>{error}</p>}
      {success && <p style={{ color: "green" }}>Saved.</p>}

      <form onSubmit={onSubmit}>
        <fieldset style={{ marginBottom: "1rem" }}>
          <legend>Profile</legend>
          <div style={{ marginBottom: "0.75rem" }}>
            <label htmlFor="displayName">Display name</label>
            <input
              id="displayName"
              value={profile.displayName ?? ""}
              onChange={(e) => setProfile((p) => p ? { ...p, displayName: e.target.value || null } : p)}
              style={{ display: "block", width: "100%", padding: "0.5rem" }}
            />
          </div>
          <div style={{ marginBottom: "0.75rem" }}>
            <label htmlFor="bio">Bio</label>
            <textarea
              id="bio"
              rows={3}
              value={profile.bio ?? ""}
              onChange={(e) => setProfile((p) => p ? { ...p, bio: e.target.value || null } : p)}
              style={{ display: "block", width: "100%", padding: "0.5rem" }}
            />
          </div>
        </fieldset>

        <fieldset style={{ marginBottom: "1rem" }}>
          <legend>Privacy</legend>
          <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.5rem" }}>
            <input
              type="checkbox"
              checked={profile.isPrivate}
              onChange={(e) => setProfile((p) => p ? { ...p, isPrivate: e.target.checked } : p)}
            />
            Private profile (only followers see your content)
          </label>
          <p style={{ fontSize: "0.875rem", color: "#666", marginTop: "0.75rem" }}>Section visibility (for non-followers when profile is public):</p>
          {(["overviewPublic", "photosPublic", "activityPublic", "rankingsPublic", "badgesPublic"] as const).map((k) => (
            <label key={k} style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.5rem" }}>
              <input
                type="checkbox"
                checked={profile[k]}
                onChange={(e) => setProfile((p) => p ? { ...p, [k]: e.target.checked } : p)}
              />
              {k.replace(/Public$/, " public")}
            </label>
          ))}
        </fieldset>

        <fieldset style={{ marginBottom: "1rem" }}>
          <legend>Close friends</legend>
          <form onSubmit={addCloseFriend} style={{ display: "flex", gap: "0.5rem", marginBottom: "0.5rem" }}>
            <input value={closeFriendSlug} onChange={(e) => setCloseFriendSlug(e.target.value)} placeholder="Handle (slug)" style={{ flex: 1, padding: "0.5rem" }} />
            <button type="submit">Add</button>
          </form>
          <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
            {closeFriends.map((c) => (
              <li key={c.slug} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0.25rem 0" }}>
                <a href={`/${c.slug}`}>{c.displayName ?? c.slug}</a>
                <button type="button" onClick={() => removeCloseFriend(c.slug)}>Remove</button>
              </li>
            ))}
          </ul>
        </fieldset>

        <fieldset style={{ marginBottom: "1rem" }}>
          <legend>Accept always</legend>
          <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.5rem" }}>
            <input
              type="checkbox"
              checked={profile.acceptFollowRequestsAlways}
              onChange={(e) => setProfile((p) => p ? { ...p, acceptFollowRequestsAlways: e.target.checked } : p)}
            />
            Auto-accept follow requests
          </label>
          <label style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <input
              type="checkbox"
              checked={profile.acceptMessageRequestsAlways}
              onChange={(e) => setProfile((p) => p ? { ...p, acceptMessageRequestsAlways: e.target.checked } : p)}
            />
            Auto-accept message requests
          </label>
        </fieldset>

        <button type="submit" disabled={saving}>{saving ? "Saving…" : "Save"}</button>
      </form>
    </main>
  );
}
