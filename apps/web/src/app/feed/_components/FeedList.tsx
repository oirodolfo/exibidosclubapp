"use client";

import Link from "next/link";
import { page, link, text } from "@/lib/variants";

/**
 * Feed list: mobile-first scrollable list.
 * Uses existing swipe feed API for content when available; otherwise placeholder.
 * Feed is always accessible — no verification gate here.
 */
export function FeedList() {
  return (
    <section className={page.default} aria-label="Feed">
      <div className="min-h-[50vh]">
        <p className={text.muted}>
          Your feed. Scroll to see more. Upload is available via the button below.
        </p>
        <p className="mt-4">
          <Link href="/swipe" className={link}>
            Open swipe feed
          </Link>
          {" · "}
          <Link href="/" className={link}>
            Home
          </Link>
        </p>
      </div>
    </section>
  );
}
