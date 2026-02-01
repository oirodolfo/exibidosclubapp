"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { useSearch, type SearchEntityType, type SearchResult } from "@/hooks/api/useSearch";
import { useCategories } from "@/hooks/api/useCategories";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { Chip } from "@/components/ui/Chip";
import { page, card } from "@/lib/variants";
import { cn } from "@/lib/cn";

const TYPES: { value: SearchEntityType; label: string }[] = [
  { value: "profile", label: "Perfis" },
  { value: "photo", label: "Fotos" },
  { value: "category", label: "Categorias" },
  { value: "tag", label: "Tags" },
];

export default function SearchPage() {
  const searchParams = useSearchParams();
  const q = searchParams.get("q") ?? "";
  const typesParam = searchParams.get("types") ?? "";
  const [localQ, setLocalQ] = useState(q);
  const [filtersOpen, setFiltersOpen] = useState(false);

  const typeList = ["profile", "photo", "category", "tag"] as const;
  const types: SearchEntityType[] | undefined = typesParam
    ? typesParam.split(",").filter((t): t is SearchEntityType => typeList.includes(t as typeof typeList[number]))
    : undefined;

  const params = {
    q: localQ || q,
    limit: 20,
    offset: 0,
    types,
  };

  const { data, isLoading, error, refetch } = useSearch(params);
  const { data: categories } = useCategories();

  useEffect(() => {
    setLocalQ(q);
  }, [q]);

  const hasQuery = (localQ || q).trim().length >= 1;

  return (
    <main className={cn(page.wide, "min-h-screen pb-24 md:pb-8")}>
      <div className="md:flex md:gap-8">
        <aside className="hidden md:block md:w-56 flex-shrink-0">
          <SearchFiltersSidebar
            types={types}
            onTypesChange={(t) => {
              const sp = new URLSearchParams(searchParams);
              if (t?.length) sp.set("types", t.join(","));
              else sp.delete("types");
              window.history.replaceState(null, "", `?${sp}`);
            }}
          />
        </aside>

        <div className="flex-1 min-w-0">
          <div className="md:hidden flex items-center gap-2 py-3">
            <input
              type="search"
              value={localQ}
              onChange={(e) => setLocalQ(e.target.value)}
              placeholder="Buscar…"
              className={cn(
                "flex-1 rounded-exibidos-md border border-white/15 bg-exibidos-surface px-4 py-2.5 text-exibidos-ink placeholder:text-exibidos-muted focus:outline-none focus:ring-2 focus:ring-exibidos-purple/50"
              )}
            />
            <button
              type="button"
              onClick={() => setFiltersOpen(true)}
              className="rounded-full border border-white/15 bg-exibidos-surface px-4 py-2.5 text-sm text-exibidos-ink"
            >
              Filtros
            </button>
          </div>

          {!hasQuery && (
            <SearchEmptyState categories={categories ?? []} />
          )}

          {hasQuery && error && (
            <SearchErrorState onRetry={() => refetch()} />
          )}

          {hasQuery && !error && !isLoading && data && !hasAnyResults(data) && (
            <SearchNoResultsState query={params.q} />
          )}

          {hasQuery && isLoading && (
            <SearchSkeleton />
          )}

          {hasQuery && !error && data && hasAnyResults(data) && (
            <SearchResults data={data} />
          )}

          {filtersOpen && (
            <SearchFiltersSheet
              types={types}
              onTypesChange={(t) => {
                const sp = new URLSearchParams(searchParams);
                if (t?.length) sp.set("types", t.join(","));
                else sp.delete("types");
                window.history.replaceState(null, "", `?${sp}`);
              }}
              onClose={() => setFiltersOpen(false)}
            />
          )}
        </div>
      </div>
    </main>
  );
}

function hasAnyResults(d: SearchResult) {
  return (
    d.profiles.length > 0 ||
    d.photos.length > 0 ||
    d.categories.length > 0 ||
    d.tags.length > 0
  );
}

function SearchFiltersSidebar({
  types,
  onTypesChange,
}: {
  types?: SearchEntityType[];
  onTypesChange: (t: SearchEntityType[] | undefined) => void;
}) {
  const toggle = (v: SearchEntityType) => {
    const next = types?.includes(v)
      ? (types.filter((t) => t !== v).length ? types.filter((t) => t !== v) : undefined)
      : [...(types ?? []), v];

    onTypesChange(next?.length ? next : undefined);
  };

  return (
    <div className={cn(card(), "p-4 sticky top-20")}>
      <h2 className="text-sm font-semibold text-exibidos-ink mb-3">Tipo de conteúdo</h2>
      <ul className="space-y-2">
        {TYPES.map(({ value, label }) => (
          <li key={value}>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={!types || types.includes(value)}
                onChange={() => toggle(value)}
                className="rounded border-white/20 text-exibidos-purple focus:ring-exibidos-purple"
              />
              <span className="text-sm text-exibidos-ink">{label}</span>
            </label>
          </li>
        ))}
      </ul>
    </div>
  );
}

function SearchFiltersSheet({
  types,
  onTypesChange,
  onClose,
}: {
  types?: SearchEntityType[];
  onTypesChange: (t: SearchEntityType[] | undefined) => void;
  onClose: () => void;
}) {
  const toggle = (v: SearchEntityType) => {
    const next = types?.includes(v)
      ? types.filter((t) => t !== v)
      : [...(types ?? []), v];

    onTypesChange(next.length ? next : undefined);
  };

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/50 md:hidden" onClick={onClose} aria-hidden />
      <div className="fixed bottom-0 left-0 right-0 z-50 rounded-t-exibidos-xl border-t border-white/10 bg-exibidos-surface p-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] md:hidden">
        <h2 className="text-lg font-semibold text-exibidos-ink mb-4">Filtros</h2>
        <ul className="space-y-3">
          {TYPES.map(({ value, label }) => (
            <li key={value}>
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={!types || types.includes(value)}
                  onChange={() => toggle(value)}
                  className="rounded border-white/20 text-exibidos-purple focus:ring-exibidos-purple"
                />
                <span className="text-exibidos-ink">{label}</span>
              </label>
            </li>
          ))}
        </ul>
        <Button variant="secondary" className="w-full mt-6" onClick={onClose}>
          Fechar
        </Button>
      </div>
    </>
  );
}

function SearchEmptyState({ categories }: { categories: { id: string; name: string; slug: string }[] }) {
  return (
    <div className="py-12 text-center">
      <h1 className="text-2xl font-bold text-exibidos-ink mb-2">Descubra</h1>
      <p className="text-exibidos-muted mb-6">Digite na busca ou explore categorias em destaque.</p>
      {categories.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {categories.slice(0, 6).map((c) => (
            <Link
              key={c.id}
              href={`/categories/${c.slug}/feed`}
              className={cn(card(), "p-4 text-left hover:border-exibidos-purple/30 transition-colors")}
            >
              <p className="font-semibold text-exibidos-ink">{c.name}</p>
              <p className="text-xs text-exibidos-muted mt-0.5">Categoria</p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

function SearchErrorState({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="py-12 text-center">
      <p className="text-exibidos-magenta mb-4">Algo deu errado. Tente novamente.</p>
      <Button variant="secondary" onClick={onRetry}>Tentar novamente</Button>
    </div>
  );
}

function SearchNoResultsState({ query }: { query: string }) {
  return (
    <div className="py-12 text-center">
      <p className="text-exibidos-ink mb-1">Nenhum resultado para &quot;{query}&quot;</p>
      <p className="text-exibidos-muted text-sm">Tente outros termos ou filtros.</p>
    </div>
  );
}

function SearchSkeleton() {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 animate-pulse">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="aspect-square rounded-exibidos-md bg-white/10" />
      ))}
    </div>
  );
}

function SearchResults({ data }: { data: SearchResult }) {
  return (
    <div className="space-y-10">
      {data.profiles.length > 0 && (
        <section>
          <h2 className="text-sm font-semibold uppercase tracking-wider text-exibidos-muted mb-3">Perfis</h2>
          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {data.profiles.map((p) => (
              <li key={p.id}>
                <Link
                  href={`/${p.slug}`}
                  className={cn(card(), "flex items-center gap-4 p-4 hover:border-exibidos-purple/30 transition-colors")}
                >
                  <Avatar size="lg" fallback={p.displayName ?? p.slug} />
                  <div className="min-w-0">
                    <p className="font-semibold text-exibidos-ink truncate">{p.displayName ?? `@${p.slug}`}</p>
                    <p className="text-sm text-exibidos-muted">@{p.slug}</p>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      {data.photos.length > 0 && (
        <section>
          <h2 className="text-sm font-semibold uppercase tracking-wider text-exibidos-muted mb-3">Fotos</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {data.photos.map((p) => (
              <Link
                key={p.id}
                href={`/${p.slug}/photos/${p.id}`}
                className="group block aspect-square overflow-hidden rounded-exibidos-md bg-exibidos-elevated transition-transform hover:scale-[1.02]"
              >
                <div className="relative h-full w-full">
                  {p.thumbUrl ? (
                    <img src={p.thumbUrl} alt={p.caption ?? "Photo"} className="h-full w-full object-cover" />
                  ) : (
                    <div className="h-full w-full flex items-center justify-center text-exibidos-muted text-sm">[img]</div>
                  )}
                  {p.caption && (
                    <p className="absolute bottom-0 left-0 right-0 truncate bg-gradient-to-t from-black/80 to-transparent px-2 py-1 text-xs text-white opacity-0 group-hover:opacity-100 transition-opacity">
                      {p.caption}
                    </p>
                  )}
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {data.categories.length > 0 && (
        <section>
          <h2 className="text-sm font-semibold uppercase tracking-wider text-exibidos-muted mb-3">Categorias</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {data.categories.map((c) => (
              <Link
                key={c.id}
                href={`/categories/${c.slug}/feed`}
                className={cn(card(), "p-4 hover:border-exibidos-purple/30 transition-colors")}
              >
                <p className="font-semibold text-exibidos-ink">{c.name}</p>
                {c.description && (
                  <p className="text-sm text-exibidos-muted mt-1 line-clamp-2">{c.description}</p>
                )}
              </Link>
            ))}
          </div>
        </section>
      )}

      {data.tags.length > 0 && (
        <section>
          <h2 className="text-sm font-semibold uppercase tracking-wider text-exibidos-muted mb-3">Tags</h2>
          <div className="flex flex-wrap gap-2">
            {data.tags.map((t) => (
              <Link key={t.id} href={`/categories?tag=${t.slug}`}>
                <Chip variant="purple" className="cursor-pointer hover:bg-exibidos-purple/30">
                  {t.name}
                </Chip>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
