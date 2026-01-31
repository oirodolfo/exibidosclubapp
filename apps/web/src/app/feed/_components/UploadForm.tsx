"use client";

import { useState } from "react";
import { page, field, fieldLabel, fieldset, text } from "@/lib/variants";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

const ALLOWED_TYPES = "image/jpeg,image/png,image/webp";
const MAX_MB = 10;

interface UploadFormProps {
  onDone: () => void;
  onCancel: () => void;
}

/**
 * Upload form for feed: same as main upload but with onDone/onCancel.
 * Used when user is VERIFIED and taps Upload. Submits to /api/images/upload.
 */
export function UploadForm({ onDone, onCancel }: UploadFormProps) {
  const [file, setFile] = useState<File | null>(null);
  const [caption, setCaption] = useState("");
  const [visibility, setVisibility] = useState<"public" | "swipe_only">("public");
  const [blurMode, setBlurMode] = useState<"none" | "eyes" | "full">("none");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

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
    formData.set("blurMode", blurMode);
    try {
      const res = await fetch("/api/images/upload", {
        method: "POST",
        body: formData,
      });
      const data = (await res.json().catch(() => ({}))) as {
        error?: string;
        duplicateOf?: string;
      };
      if (!res.ok) {
        if (res.status === 401) {
          onCancel();
          setLoading(false);
          return;
        }
        if (res.status === 409 && data.duplicateOf) {
          setError("This photo was already uploaded.");
          setLoading(false);
          return;
        }
        const code = data.error;
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
      onDone();
    } catch {
      setError("Something went wrong.");
    }
    setLoading(false);
  }

  return (
    <div className={`fixed inset-0 z-50 overflow-y-auto bg-white ${page.default}`}>
      <h1 className="text-xl font-semibold">Upload photo</h1>
      {error && <p className={`mb-4 ${text.error}`}>{error}</p>}
      <form onSubmit={onSubmit}>
        <fieldset className={fieldset}>
          <legend className="sr-only">Photo</legend>
          <div className={field}>
            <label htmlFor="feed-file" className={fieldLabel}>
              Image (JPEG, PNG, WebP, max {MAX_MB}MB)
            </label>
            <input
              id="feed-file"
              type="file"
              accept={ALLOWED_TYPES}
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              className="block w-full text-sm"
            />
          </div>
          <div className={field}>
            <label htmlFor="feed-caption" className={fieldLabel}>
              Caption (optional)
            </label>
            <Input
              id="feed-caption"
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
          <div className={field}>
            <span className={fieldLabel}>Face blur (privacy)</span>
            <div className="flex flex-wrap gap-4 mt-1">
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="blurMode"
                  checked={blurMode === "none"}
                  onChange={() => setBlurMode("none")}
                />
                None
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="blurMode"
                  checked={blurMode === "eyes"}
                  onChange={() => setBlurMode("eyes")}
                />
                Eyes only
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="blurMode"
                  checked={blurMode === "full"}
                  onChange={() => setBlurMode("full")}
                />
                Full face
              </label>
            </div>
          </div>
        </fieldset>
        <div className="flex gap-3">
          <Button type="submit" disabled={loading}>
            {loading ? "Uploading…" : "Upload"}
          </Button>
          <Button type="button" variant="ghost" onClick={onCancel}>
            Cancel
          </Button>
        </div>
      </form>
    </div>
  );
}
