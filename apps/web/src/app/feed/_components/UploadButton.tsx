"use client";

import { useState, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { UploadGateModal } from "./UploadGateModal";
import { UploadForm } from "./UploadForm";

type VerificationStatus =
  | "UNVERIFIED"
  | "PENDING"
  | "VERIFIED"
  | "REQUIRES_RECHECK"
  | "REVOKED"
  | null;

/**
 * Smart upload CTA: context-aware by verification state.
 * Large tap target, fixed on mobile (bottom center). Never uploads if status !== VERIFIED.
 */
export function UploadButton() {
  const [status, setStatus] = useState<VerificationStatus>(null);
  const [loading, setLoading] = useState(true);
  const [gateOpen, setGateOpen] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const router = useRouter();

  const fetchStatus = useCallback(async () => {
    try {
      const res = await fetch("/api/humanproof/status");
      if (res.status === 401) {
        setStatus(null);
        setLoading(false);
        return;
      }
      const data = (await res.json().catch(() => ({}))) as {
        userVerificationStatus?: VerificationStatus;
      };
      setStatus(data.userVerificationStatus ?? "UNVERIFIED");
    } catch {
      setStatus("UNVERIFIED");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  const handleUploadTap = useCallback(() => {
    if (loading) return;
    if (status === "VERIFIED") {
      setShowForm(true);
      return;
    }
    if (status === "UNVERIFIED") {
      setGateOpen(true);
      return;
    }
    if (status === "PENDING") {
      return;
    }
    if (status === "REQUIRES_RECHECK" || status === "REVOKED") {
      setGateOpen(true);
      return;
    }
    setGateOpen(true);
  }, [loading, status]);

  const handleFormDone = useCallback(() => {
    setShowForm(false);
    router.refresh();
  }, [router]);

  const handleGateClose = useCallback(() => {
    setGateOpen(false);
  }, []);

  if (showForm) {
    return (
      <>
        <UploadForm onDone={handleFormDone} onCancel={() => setShowForm(false)} />
      </>
    );
  }

  const isDisabled = status === "PENDING";
  const label =
    status === "PENDING"
      ? "Verification in progress"
      : status === "REQUIRES_RECHECK" || status === "REVOKED"
        ? "Re-verify to upload"
        : status === "VERIFIED"
          ? "Upload"
          : "Upload";

  return (
    <>
      <div className="fixed bottom-0 left-0 right-0 z-40 flex justify-center p-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
        <div className="flex flex-col items-center gap-1">
          {status === "PENDING" && (
            <p className="text-xs text-neutral-500">Verification in progress</p>
          )}
          {(status === "REQUIRES_RECHECK" || status === "REVOKED") && (
            <p className="text-xs text-neutral-500">Re-verify to upload</p>
          )}
          <Button
            type="button"
            size="lg"
            disabled={isDisabled}
            onClick={handleUploadTap}
            className="min-h-[56px] min-w-[56px] rounded-full px-6 shadow-lg sm:min-h-[52px] sm:min-w-[auto] sm:rounded-lg"
            aria-label={label}
          >
            <span className="flex items-center gap-2">
              <UploadIcon />
              <span className="hidden sm:inline">{label}</span>
            </span>
          </Button>
        </div>
      </div>
      <UploadGateModal open={gateOpen} onClose={handleGateClose} />
    </>
  );
}

function UploadIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="17 8 12 3 7 8" />
      <line x1="12" y1="3" x2="12" y2="15" />
    </svg>
  );
}
