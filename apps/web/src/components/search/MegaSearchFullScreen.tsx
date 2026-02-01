"use client";

import { useRef, useEffect } from "react";
import { MegaSearchPreview } from "./MegaSearchPreview";
import { cn } from "@/lib/cn";

export interface MegaSearchFullScreenProps {
  open: boolean;
  onClose: () => void;
  query: string;
  onQueryChange: (q: string) => void;
  onSeeAll: () => void;
  inputRef?: React.RefObject<HTMLInputElement | null>;
  className?: string;
}

export function MegaSearchFullScreen({
  open,
  onClose,
  query,
  onQueryChange,
  onSeeAll,
  inputRef,
  className,
}: MegaSearchFullScreenProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    const first = containerRef.current?.querySelector("input");

    if (first) first.focus();
  }, [open]);

  if (!open) return null;

  return (
    <div
      ref={containerRef}
      className={cn(
        "fixed inset-0 z-50 flex flex-col bg-exibidos-bg",
        className
      )}
      role="dialog"
      aria-label="Busca"
    >
      <div className="flex items-center gap-2 border-b border-white/10 px-4 py-3">
        <button
          type="button"
          onClick={onClose}
          className="flex h-10 w-10 items-center justify-center rounded-full text-exibidos-muted hover:bg-white/10 hover:text-exibidos-ink transition-colors"
          aria-label="Fechar busca"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
        </button>
        <input
          ref={inputRef}
          type="search"
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
          placeholder="Buscar perfis, fotos, categorias, tags…"
          autoComplete="off"
          className="flex-1 rounded-exibidos-md border border-white/15 bg-exibidos-surface px-4 py-2.5 text-exibidos-ink placeholder:text-exibidos-muted focus:outline-none focus:ring-2 focus:ring-exibidos-purple/50"
        />
      </div>

      <div className="flex-1 overflow-auto">
        <MegaSearchPreview
          query={query}
          onSeeAll={onSeeAll}
          variant="fullscreen"
        />
      </div>

      <div className="border-t border-white/10 p-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
        <button
          type="button"
          onClick={onSeeAll}
          className="w-full rounded-full bg-exibidos-purple py-3 text-base font-semibold text-white transition-colors hover:bg-exibidos-purple-dim focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-exibidos-purple"
        >
          Ver todos os resultados
        </button>
      </div>
    </div>
  );
}
