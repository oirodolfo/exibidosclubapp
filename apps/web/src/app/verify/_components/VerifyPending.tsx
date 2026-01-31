"use client";

import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { page, link } from "@/lib/variants";

interface VerifyPendingProps {
  onCheckStatus: () => void;
  checking?: boolean;
}

/**
 * Shown when verification is PENDING. Feed remains usable; user can leave.
 * Optional "Check status" to refresh.
 */
export function VerifyPending({ onCheckStatus, checking = false }: VerifyPendingProps) {
  return (
    <div className={page.default}>
      <h1 className="text-2xl font-semibold text-neutral-900">
        Verification in progress
      </h1>
      <p className="mt-4 text-neutral-600">
        We’re checking your submission. You can keep browsing the feed.
      </p>
      <p className="mt-2 text-sm text-neutral-500">
        We’ll update your status soon. No need to wait here.
      </p>
      <div className="mt-8 flex flex-col gap-3">
        <Button
          type="button"
          variant="secondary"
          size="lg"
          className="min-h-[52px] w-full"
          onClick={onCheckStatus}
          disabled={checking}
        >
          {checking ? "Checking…" : "Check status"}
        </Button>
        <Link href="/feed" className={`min-h-[48px] flex items-center justify-center ${link}`}>
          Back to feed
        </Link>
      </div>
    </div>
  );
}
