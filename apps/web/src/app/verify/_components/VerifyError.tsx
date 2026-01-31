"use client";

import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { page, link, text } from "@/lib/variants";

interface VerifyErrorProps {
  message: string;
  failureReasons?: readonly string[];
  onRetry: () => void;
}

/**
 * Error state: friendly message, no blame. Retry or go back to feed.
 */
export function VerifyError({
  message,
  failureReasons = [],
  onRetry,
}: VerifyErrorProps) {
  return (
    <div className={page.default}>
      <h1 className="text-2xl font-semibold text-neutral-900">
        Something didn’t work
      </h1>
      <p className={`mt-4 ${text.muted}`}>{message}</p>
      {failureReasons.length > 0 && (
        <ul className="mt-2 list-inside list-disc text-sm text-neutral-500">
          {failureReasons.map((r, i) => (
            <li key={i}>{r}</li>
          ))}
        </ul>
      )}
      <p className="mt-4 text-neutral-600">
        You can try again with a new code and a clear photo of it.
      </p>
      <div className="mt-8 flex flex-col gap-3">
        <Button
          type="button"
          size="lg"
          className="min-h-[52px] w-full"
          onClick={onRetry}
        >
          Try again
        </Button>
        <Link href="/feed" className={`min-h-[48px] flex items-center justify-center ${link}`}>
          Back to feed
        </Link>
      </div>
    </div>
  );
}
