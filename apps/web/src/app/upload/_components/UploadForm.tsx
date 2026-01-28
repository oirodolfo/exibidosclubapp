"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { page, field, fieldLabel, fieldset, link, text } from "@/lib/variants";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

const ALLOWED_TYPES = "image/jpeg,image/png,image/webp";
const MAX_MB = 10;

export function UploadForm() {
  const [file, setFile] = useState<File | null>(null);
  const [caption, setCaption] = useState("");
  const [visibility, setVisibility] = useState<"public" | "swipe_only">("public");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!file) {
      setError("Choose a photo.");
      return;
    }
    if (!ALLOWED_TYPES.split(",").includes(file.type)) {
      setError("Only JPEG, PNG, and WebP are allowed.");
      return;
    }
    if (file.size > MAX_MB * 1024 * 1024) {
      setError(`Max size ${MAX_MB}MB.`);
      return;
    }
    setLoading(true);
    const formData = new FormData();
    formData.set("file", file);
    if (caption.trim()) formData.set("caption", caption.trim());
    formData.set("visibility", visibility);
    try {
      const res = await fetch("/api/images/upload", {
        method: "POST",
        body: formData,
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string; duplicateOf?: string } & Record<string, unknown>;
      if (!res.ok) {
        if (res.status === 401) {
          router.replace("/auth/login?callbackUrl=/upload");
          return;
        }
        if (res.status === 409 && data.duplicateOf) {
          setError("This photo was already uploaded.");
          setLoading(false);
          return;
        }
        const code = data.error as string | undefined;
        const msg =
          code === "storage_unavailable"
            ? "Storage unavailable. Try again later."
            : code === "image_upload_disabled"
              ? "Upload is disabled."
              : code === "file_too_large"
                ? `Max size ${MAX_MB}MB.`
                : code === "invalid_type"
                  ? "Only JPEG, PNG, and WebP are allowed."
                  : code === "processing_failed"
                    ? "Processing failed. Try another image."
                    : code || "Upload failed.";
        setError(msg);
        setLoading(false);
        return;
      }
      const meRes = await fetch("/api/user/me");
      const me = (await meRes.json()) as { slug?: string | null };
      const slug = me?.slug;
      if (slug) router.replace(`/${slug}?tab=photos`);
      else router.replace("/");
    } catch {
      setError("Something went wrong.");
    }
    setLoading(false);
  }

  return (
    <main className={page.default}>
      <h1>Upload photo</h1>
      <p className="mb-4">
        <Link href="/settings" className={link}>Settings</Link>
        {" · "}
        <Link href="/" className={link}>Home</Link>
      </p>
      {error && <p className={`mb-4 ${text.error}`}>{error}</p>}
      <form onSubmit={onSubmit}>
        <fieldset className={fieldset}>
          <legend>Photo</legend>
          <div className={field}>
            <label htmlFor="file" className={fieldLabel}>Image (JPEG, PNG, WebP, max {MAX_MB}MB)</label>
            <input
              id="file"
              type="file"
              accept={ALLOWED_TYPES}
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              className="block w-full text-sm"
            />
          </div>
          <div className={field}>
            <label htmlFor="caption" className={fieldLabel}>Caption (optional)</label>
            <Input
              id="caption"
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder="Caption"
            />
          </div>
          <div className={field}>
            <span className={fieldLabel}>Visibility</span>
            <div className="flex gap-4 mt-1">
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="visibility"
                  checked={visibility === "public"}
                  onChange={() => setVisibility("public")}
                />
                Public
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="visibility"
                  checked={visibility === "swipe_only"}
                  onChange={() => setVisibility("swipe_only")}
                />
                Swipe only
              </label>
            </div>
          </div>
        </fieldset>
        <Button type="submit" disabled={loading}>{loading ? "Uploading…" : "Upload"}</Button>
      </form>
    </main>
  );
}
