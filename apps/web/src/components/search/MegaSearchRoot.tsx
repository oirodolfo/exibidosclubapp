"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { MegaSearchPanel } from "./MegaSearchPanel";
import { MegaSearchFullScreen } from "./MegaSearchFullScreen";
import { useSearchStore } from "@/stores/searchStore";
import { cn } from "@/lib/cn";

const PLACEHOLDER = "Buscar perfis, fotos, categorias, tags…";

export function MegaSearchRoot() {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const anchorRef = useRef<HTMLDivElement>(null);

  const {
    megasearchQuery,
    megasearchPanelOpen,
    megasearchFullScreenOpen,
    setMegasearchQuery,
    openMegasearchPanel,
    closeMegasearchPanel,
    openMegasearchFullScreen,
    closeMegasearchFullScreen,
    closeMegasearch,
  } = useSearchStore();

  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 768px)");
    setIsMobile(mq.matches);
    const handler = () => setIsMobile(mq.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  const goToFullSearch = useCallback(() => {
    const q = megasearchQuery.trim();
    closeMegasearch();
    if (q) router.push(`/search?q=${encodeURIComponent(q)}`);
    else router.push("/search");
  }, [megasearchQuery, router, closeMegasearch]);

  return (
    <>
      <div ref={anchorRef} className="relative flex items-center">
        {isMobile ? (
          <button
            type="button"
            onClick={openMegasearchFullScreen}
            className="flex h-10 w-10 items-center justify-center rounded-full text-exibidos-muted hover:bg-white/10 hover:text-exibidos-ink transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-exibidos-purple"
            aria-label="Abrir busca"
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.35-4.35" />
            </svg>
          </button>
        ) : (
          <div
            className={cn(
              "flex items-center rounded-full border bg-exibidos-surface transition-all duration-200",
              megasearchPanelOpen
                ? "w-[min(420px,90vw)] border-exibidos-purple/40 ring-2 ring-exibidos-purple/20"
                : "w-[200px] border-white/15 hover:border-white/25"
            )}
          >
            <span className="pl-4 text-exibidos-muted">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8" />
                <path d="m21 21-4.35-4.35" />
              </svg>
            </span>
            <input
              ref={inputRef}
              type="search"
              value={megasearchQuery}
              onChange={(e) => setMegasearchQuery(e.target.value)}
              onFocus={openMegasearchPanel}
              placeholder={PLACEHOLDER}
              autoComplete="off"
              className="flex-1 min-w-0 bg-transparent py-2.5 pr-4 pl-2 text-exibidos-ink placeholder:text-exibidos-muted focus:outline-none"
            />
          </div>
        )}
      </div>

      {!isMobile && (
        <MegaSearchPanel
          open={megasearchPanelOpen}
          onClose={closeMegasearchPanel}
          query={megasearchQuery}
          onSeeAll={goToFullSearch}
          anchorRef={anchorRef}
        />
      )}

      <MegaSearchFullScreen
        open={isMobile && megasearchFullScreenOpen}
        onClose={closeMegasearchFullScreen}
        query={megasearchQuery}
        onQueryChange={setMegasearchQuery}
        onSeeAll={goToFullSearch}
        inputRef={inputRef}
      />
    </>
  );
}
