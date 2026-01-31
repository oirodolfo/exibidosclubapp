"use client";

import { useCallback, useRef, useState, useEffect } from "react";
import { Button } from "@/components/ui/Button";
import { page, text } from "@/lib/variants";

interface VerifyStepCameraProps {
  onCapture: (blob: Blob) => void;
  onBack: () => void;
  loading?: boolean;
}

/**
 * Step 2: Camera capture. Prefer rear camera on mobile for handwritten code photo.
 * Single primary action: capture and upload.
 */
export function VerifyStepCamera({
  onCapture,
  onBack,
  loading = false,
}: VerifyStepCameraProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  const startCamera = useCallback(async () => {
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: "environment",
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setReady(true);
      }
    } catch (e) {
      const msg =
        e instanceof Error ? e.message : "Camera unavailable.";
      setError(msg);
    }
  }, []);

  useEffect(() => {
    startCamera();
    return () => {
      streamRef.current?.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    };
  }, [startCamera]);

  const handleCapture = useCallback(() => {
    const video = videoRef.current;
    if (!video || !streamRef.current || loading) return;
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(video, 0, 0);
    canvas.toBlob(
      (blob) => {
        if (blob) onCapture(blob);
      },
      "image/jpeg",
      0.9
    );
  }, [onCapture, loading]);

  return (
    <div className={page.default}>
      <h1 className="text-2xl font-semibold text-neutral-900">
        Take a photo of the code
      </h1>
      <p className="mt-2 text-neutral-600">
        Point your camera at the paper with the code. Good lighting helps.
      </p>
      {error && (
        <p className={`mt-4 ${text.error}`}>
          {error}
          <button
            type="button"
            className="ml-2 underline"
            onClick={startCamera}
          >
            Try again
          </button>
        </p>
      )}
      {!error && (
        <>
          <div className="relative mt-6 aspect-[4/3] w-full overflow-hidden rounded-xl bg-neutral-900">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="h-full w-full object-cover"
            />
            {!ready && (
              <div className="absolute inset-0 flex items-center justify-center text-white">
                Starting camera…
              </div>
            )}
          </div>
          <div className="mt-6 flex flex-col gap-3">
            <Button
              type="button"
              size="lg"
              className="min-h-[52px] w-full"
              onClick={handleCapture}
              disabled={!ready || loading}
            >
              {loading ? "Uploading…" : "Use this photo"}
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="lg"
              className="min-h-[48px] w-full"
              onClick={onBack}
              disabled={loading}
            >
              Back
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
