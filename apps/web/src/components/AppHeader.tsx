"use client";

import Link from "next/link";
import { MegaSearchRoot } from "@/components/search/MegaSearchRoot";

const HEADER_HEIGHT = "56px";

export function AppHeader() {
  return (
    <header
      className="sticky top-0 z-30 flex h-14 items-center justify-between gap-4 border-b border-white/10 bg-exibidos-bg/95 px-4 backdrop-blur-md"
      style={{ minHeight: HEADER_HEIGHT, "--header-height": HEADER_HEIGHT } as React.CSSProperties}
    >
      <Link
        href="/"
        className="flex-shrink-0 font-bold tracking-tight text-exibidos-ink hover:text-exibidos-lime transition-colors"
      >
        EXIBIDOS
      </Link>

      <div className="flex flex-1 items-center justify-center max-w-xl mx-auto px-2">
        <MegaSearchRoot />
      </div>

      <div className="flex flex-shrink-0 items-center gap-2 w-[80px] justify-end">
        <Link
          href="/feed"
          className="text-sm font-medium text-exibidos-muted hover:text-exibidos-ink transition-colors"
        >
          Feed
        </Link>
      </div>
    </header>
  );
}
