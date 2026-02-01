"use client";

import { useRef, useEffect } from "react";
import { MegaSearchPreview } from "./MegaSearchPreview";
import { cn } from "@/lib/cn";

export interface MegaSearchPanelProps {
  open: boolean;
  onClose: () => void;
  query: string;
  onSeeAll: () => void;
  anchorRef: React.RefObject<HTMLElement | null>;
  className?: string;
}

export function MegaSearchPanel({
  open,
  onClose,
  query,
  onSeeAll,
  anchorRef,
  className,
}: MegaSearchPanelProps) {
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    function handleClickOutside(e: MouseEvent) {
      const anchor = anchorRef.current;
      const panel = panelRef.current;

      if (
        anchor?.contains(e.target as Node) ||
        panel?.contains(e.target as Node)
      ) return;

      onClose();
    }

    function handleEscape(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [open, onClose, anchorRef]);

  if (!open) return null;

  const anchor = anchorRef.current;
  const rect = anchor?.getBoundingClientRect();

  return (
    <>
      <div
        className="fixed inset-0 z-40 bg-black/40 backdrop-blur-[2px] transition-opacity md:block"
        aria-hidden
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-label="Resultados da busca"
        className={cn(
          "fixed left-4 right-4 top-[calc(var(--header-height,56px)+8px)] z-50 max-h-[min(70vh,480px)] overflow-auto rounded-exibidos-lg border border-white/10 bg-exibidos-surface shadow-exibidos-card transition-all duration-200 md:left-auto md:right-4 md:max-w-md",
          className
        )}
        style={
          rect
            ? {
                top: rect.bottom + 8,
                left: Math.min(rect.left, window.innerWidth - 420),
                width: Math.min(420, rect.width + 80),
              }
            : undefined
        }
      >
        <MegaSearchPreview
          query={query}
          onSeeAll={onSeeAll}
          variant="panel"
        />
      </div>
    </>
  );
}
