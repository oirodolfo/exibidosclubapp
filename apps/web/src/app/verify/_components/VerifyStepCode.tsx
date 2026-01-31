"use client";

import { Button } from "@/components/ui/Button";
import { page } from "@/lib/variants";

interface VerifyStepCodeProps {
  code: string;
  expiresAt: string;
  onNext: () => void;
  loading?: boolean;
}

/**
 * Step 1: Show handwritten code. User writes it on paper, then takes a photo in next step.
 * Large text, single primary action.
 */
export function VerifyStepCode({
  code,
  expiresAt,
  onNext,
  loading = false,
}: VerifyStepCodeProps) {
  return (
    <div className={page.default}>
      <h1 className="text-2xl font-semibold text-neutral-900">
        Write this code on paper
      </h1>
      <p className="mt-2 text-neutral-600">
        Use a pen. We’ll ask for a photo of it in the next step.
      </p>
      <div
        className="mt-6 rounded-xl border-2 border-dashed border-neutral-300 bg-neutral-50 p-6 text-center"
        aria-label="Verification code"
      >
        <span className="text-3xl font-mono font-bold tracking-widest text-neutral-900 sm:text-4xl">
          {code}
        </span>
      </div>
      <p className="mt-4 text-sm text-neutral-500">
        Code expires at {new Date(expiresAt).toLocaleTimeString()}.
      </p>
      <Button
        type="button"
        size="lg"
        className="mt-8 min-h-[52px] w-full"
        onClick={onNext}
        disabled={loading}
      >
        {loading ? "Loading…" : "Next: take a photo"}
      </Button>
    </div>
  );
}
