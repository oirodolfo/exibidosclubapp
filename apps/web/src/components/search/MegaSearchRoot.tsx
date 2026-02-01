"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { MegaSearchPanel } from "./MegaSearchPanel";
import { MegaSearchFullScreen } from "./MegaSearchFullScreen";
import { cn } from "@/lib/cn";

const PLACEHOLDER = "Buscar perfis, fotos, categorias, tags…";

export function MegaSearchRoot() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [panelOpen, setPanelOpen] = useState(false);
  const [fullScreenOpen, setFullScreenOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const anchorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 768px)");

    setIsMobile(mq.matches);

    const handler = () => setIsMobile(mq.matches);

    mq.addEventListener("change", handler);

    return () => mq.removeEventListener("change", handler);
  }, []);

  const openPanel = useCallback(() => {
    setPanelOpen(true);
    setFullScreenOpen(false);
  }, []);

  const closePanel = useCallback(() => {
    setPanelOpen(false);
  }, []);

  const openFullScreen = useCallback(() => {
    setFullScreenOpen(true);
    setPanelOpen(false);
  }, []);

  const closeFullScreen = useCallback(() => {
    setFullScreenOpen(false);
  }, []);

  const goToFullSearch = useCallback(() => {
    const q = query.trim();

    closePanel();
    closeFullScreen();

    if (q) router.push(`/search?q=${encodeURIComponent(q)}`);
    else router.push("/search");
  }, [query, router, closePanel, closeFullScreen]);

  return (
    <>
      <div ref={anchorRef} className="relative flex items-center">
        {isMobile ? (
          <button
            type="button"
            onClick={openFullScreen}
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
              panelOpen
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
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onFocus={openPanel}
              placeholder={PLACEHOLDER}
              autoComplete="off"
              className="flex-1 min-w-0 bg-transparent py-2.5 pr-4 pl-2 text-exibidos-ink placeholder:text-exibidos-muted focus:outline-none"
            />
          </div>
        )}
      </div>

      {!isMobile && (
        <MegaSearchPanel
          open={panelOpen}
          onClose={closePanel}
          query={query}
          onSeeAll={goToFullSearch}
          anchorRef={anchorRef}
        />
      )}

      <MegaSearchFullScreen
        open={isMobile && fullScreenOpen}
        onClose={closeFullScreen}
        query={query}
        onQueryChange={setQuery}
        onSeeAll={goToFullSearch}
        inputRef={inputRef}
      />
    </>
  );
}
