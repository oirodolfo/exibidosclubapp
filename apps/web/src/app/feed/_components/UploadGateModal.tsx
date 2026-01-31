"use client";

import { useCallback } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";

interface UploadGateModalProps {
  open: boolean;
  onClose: () => void;
}

/**
 * Shown when user taps Upload without being verified.
 * Full-screen on mobile, bottom-sheet style. Friendly copy; no blame language.
 */
export function UploadGateModal({ open, onClose }: UploadGateModalProps) {
  const router = useRouter();

  const handleStartVerification = useCallback(() => {
    onClose();
    router.push("/verify");
  }, [onClose, router]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col justify-end bg-black/40 sm:items-center sm:justify-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="upload-gate-title"
    >
      <div
        className="w-full rounded-t-2xl bg-white p-6 pb-[env(safe-area-inset-bottom)] shadow-lg sm:max-w-[400px] sm:rounded-2xl sm:pb-6"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id="upload-gate-title" className="text-xl font-semibold text-neutral-900">
          Verify to upload
        </h2>
        <p className="mt-3 text-neutral-600">
          To keep the community safe, we need to verify you before uploading pictures.
        </p>
        <p className="mt-2 text-sm text-neutral-500">
          Quick steps: show a code on paper, then take a photo. No account changes.
        </p>
        <div className="mt-6 flex flex-col gap-3">
          <Button
            type="button"
            size="lg"
            className="min-h-[48px] w-full"
            onClick={handleStartVerification}
          >
            Start verification
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="lg"
            className="min-h-[48px] w-full"
            onClick={onClose}
          >
            Not now
          </Button>
        </div>
      </div>
      <button
        type="button"
        className="absolute inset-0 -z-10"
        aria-label="Close"
        onClick={onClose}
      />
    </div>
  );
}
