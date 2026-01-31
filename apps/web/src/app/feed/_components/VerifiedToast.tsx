"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

/**
 * Shows a one-time success toast when ?verified=1 (after verification flow).
 * Mobile-friendly: bottom of screen, auto-dismiss. Clears query from URL.
 */
export function VerifiedToast() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (searchParams.get("verified") === "1") {
      setShow(true);
      router.replace("/feed", { scroll: false });
      const t = setTimeout(() => setShow(false), 4000);
      return () => clearTimeout(t);
    }
    return undefined;
  }, [searchParams, router]);

  if (!show) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed bottom-24 left-4 right-4 z-50 rounded-lg bg-neutral-900 px-4 py-3 text-center text-white shadow-lg sm:left-auto sm:right-4 sm:max-w-sm"
    >
      You can now upload pictures.
    </div>
  );
}
