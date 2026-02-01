"use client";

import { useCallback, useState, useRef } from "react";
import Cropper, { type Area } from "react-easy-crop";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { createCroppedImageBlob } from "@/lib/crop-image";

type ProfilePhotoEditorProps = {
  avatarUrl: string | null;
  displayName: string | null;
  onSuccess: () => void;
};

const ACCEPT = "image/jpeg,image/png,image/webp";
const MAX_SIZE_BYTES = 2 * 1024 * 1024;

export function ProfilePhotoEditor({
  avatarUrl,
  displayName,
  onSuccess,
}: ProfilePhotoEditorProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [uploading, setUploading] = useState(false);
  const [cropError, setCropError] = useState<string | null>(null);
  const fileRef = useRef<File | null>(null);

  const onCropComplete = useCallback((_: Area, areaPixels: Area) => {
    setCroppedAreaPixels(areaPixels);
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];

    if (!file) return;

    if (!file.type.match(/^image\/(jpeg|png|webp)$/)) {
      setCropError("Use JPEG, PNG or WebP.");
      return;
    }

    if (file.size > MAX_SIZE_BYTES) {
      setCropError("Image must be under 2 MB.");
      return;
    }

    setCropError(null);
    fileRef.current = file;
    const url = URL.createObjectURL(file);
    setImageSrc(url);
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setCroppedAreaPixels(null);
  };

  const closeCrop = useCallback(() => {
    if (imageSrc) URL.revokeObjectURL(imageSrc);
    setImageSrc(null);
    setCroppedAreaPixels(null);
    fileRef.current = null;
    setCropError(null);
    if (inputRef.current) inputRef.current.value = "";
  }, [imageSrc]);

  const handleSaveCrop = async () => {
    if (!imageSrc || !croppedAreaPixels || !fileRef.current) return;

    setUploading(true);
    setCropError(null);

    try {
      const mime = fileRef.current.type as "image/jpeg" | "image/png" | "image/webp";
      const blob = await createCroppedImageBlob(
        imageSrc,
        croppedAreaPixels,
        mime === "image/webp" ? "image/webp" : "image/jpeg",
        0.9
      );

      const formData = new FormData();
      const ext = mime === "image/png" ? "png" : mime === "image/webp" ? "webp" : "jpg";
      formData.append("file", blob, `avatar.${ext}`);

      const res = await fetch("/api/user/avatar", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        setCropError((d as { error?: string }).error ?? "Upload failed");
        setUploading(false);
        return;
      }

      closeCrop();
      onSuccess();
    } catch {
      setCropError("Something went wrong.");
    }

    setUploading(false);
  };

  const initials = displayName
    ? displayName.slice(0, 2).toUpperCase()
    : "?";

  return (
    <div className="flex flex-col items-start gap-3">
      <div className="flex items-center gap-4">
        <Avatar
          src={avatarUrl}
          alt="Profile"
          size="xl"
          fallback={initials}
          imgProps={{ unoptimized: true }}
        />
        <div className="flex flex-col gap-2">
          <input
            ref={inputRef}
            type="file"
            accept={ACCEPT}
            className="hidden"
            onChange={handleFileChange}
            aria-label="Choose profile photo"
          />
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={() => inputRef.current?.click()}
          >
            {avatarUrl ? "Change photo" : "Add photo"}
          </Button>
          <p className="text-exibidos-muted text-xs">
            Square crop; shown as circle. Max 2 MB.
          </p>
        </div>
      </div>

      {imageSrc && (
        <div
          className="fixed inset-0 z-50 flex flex-col bg-black/90"
          role="dialog"
          aria-modal="true"
          aria-label="Crop profile photo"
        >
          <div className="flex-1 relative w-full min-h-0">
            <Cropper
              image={imageSrc}
              crop={crop}
              zoom={zoom}
              aspect={1}
              cropShape="rect"
              showGrid={true}
              onCropChange={setCrop}
              onZoomChange={setZoom}
              onCropComplete={onCropComplete}
              style={{ containerStyle: { backgroundColor: "black" } }}
            />
          </div>
          <div className="flex-shrink-0 flex items-center justify-between gap-4 p-4 bg-exibidos-bg border-t border-white/10">
            <label className="flex items-center gap-2 text-exibidos-ink text-sm">
              Zoom
              <input
                type="range"
                min={1}
                max={3}
                step={0.1}
                value={zoom}
                onChange={(e) => setZoom(Number(e.target.value))}
                className="w-32"
              />
            </label>
            <div className="flex gap-2">
              <Button type="button" variant="ghost" onClick={closeCrop} disabled={uploading}>
                Cancel
              </Button>
              <Button
                type="button"
                variant="primary"
                onClick={handleSaveCrop}
                disabled={uploading || !croppedAreaPixels}
              >
                {uploading ? "Uploading…" : "Save"}
              </Button>
            </div>
          </div>
          {cropError && (
            <p className="text-exibidos-magenta text-sm px-4 pb-2">{cropError}</p>
          )}
        </div>
      )}
    </div>
  );
}
