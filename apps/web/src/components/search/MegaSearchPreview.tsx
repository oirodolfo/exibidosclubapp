"use client";

import Link from "next/link";
import { useMegasearch } from "@/hooks/api/useMegasearch";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { Avatar } from "@/components/ui/Avatar";
import { Chip } from "@/components/ui/Chip";
import { cn } from "@/lib/cn";

const PLACEHOLDER = "Buscar perfis, fotos, categorias, tags…";

export interface MegaSearchPreviewProps {
  query: string;
  onSeeAll?: () => void;
  className?: string;
  /** Compact for panel, full for fullscreen */
  variant?: "panel" | "fullscreen";
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="text-xs font-semibold uppercase tracking-wider text-exibidos-muted mb-2">
      {children}
    </h3>
  );
}

function ProfileItem({
  slug,
  displayName,
  highlight,
}: {
  slug: string;
  displayName: string | null;
  highlight?: boolean;
}) {
  const label = displayName ?? `@${slug}`;

  return (
    <Link
      href={`/${slug}`}
      className={cn(
        "flex items-center gap-3 rounded-exibidos-md p-2 transition-colors hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-exibidos-purple",
        highlight && "bg-exibidos-purple/10 ring-1 ring-exibidos-purple/30"
      )}
    >
      <Avatar size="sm" fallback={label.slice(0, 1).toUpperCase()} className="flex-shrink-0" />
      <div className="min-w-0 flex-1">
        <p className="truncate font-medium text-exibidos-ink">{label}</p>
        <p className="truncate text-sm text-exibidos-muted">@{slug}</p>
      </div>
    </Link>
  );
}

function PhotoItem({
  id,
  caption,
  slug,
  thumbUrl,
}: {
  id: string;
  caption: string | null;
  slug: string;
  thumbUrl?: string | null;
}) {
  return (
    <Link
      href={`/${slug}/photos/${id}`}
      className="group block aspect-square overflow-hidden rounded-exibidos-md bg-exibidos-elevated transition-transform hover:scale-[1.02] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-exibidos-purple"
    >
      <div className="relative h-full w-full">
        {thumbUrl ? (
          <img
            src={thumbUrl}
            alt={caption ?? "Photo"}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-exibidos-muted text-sm">
            [img]
          </div>
        )}
        {caption && (
          <p className="absolute bottom-0 left-0 right-0 truncate bg-gradient-to-t from-black/80 to-transparent px-2 py-1 text-xs text-white">
            {caption}
          </p>
        )}
      </div>
    </Link>
  );
}

function CategoryItem({ name, slug }: { name: string; slug: string }) {
  return (
    <Link
      href={`/categories/${slug}/feed`}
      className="block rounded-exibidos-md border border-white/10 bg-exibidos-surface/80 p-3 transition-colors hover:border-exibidos-purple/30 hover:bg-white/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-exibidos-purple"
    >
      <p className="font-semibold text-exibidos-ink">{name}</p>
      <p className="text-xs text-exibidos-muted mt-0.5">Categoria</p>
    </Link>
  );
}

function TagItem({ name, slug }: { name: string; slug: string; categoryId?: string }) {
  return (
    <Link
      href={`/categories?tag=${slug}`}
      className="inline-block"
    >
      <Chip variant="purple" className="cursor-pointer hover:bg-exibidos-purple/30 transition-colors">
        {name}
      </Chip>
    </Link>
  );
}

function SkeletonSection({ title }: { title: string }) {
  return (
    <div className="animate-pulse">
      <SectionTitle>{title}</SectionTitle>
      <div className="space-y-2">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-12 rounded-exibidos-md bg-white/10" />
        ))}
      </div>
    </div>
  );
}

export function MegaSearchPreview({
  query,
  onSeeAll,
  className,
}: MegaSearchPreviewProps) {
  const debouncedQuery = useDebouncedValue(query, 250);
  const { data, isLoading, error, isFetching } = useMegasearch(debouncedQuery);

  const hasQuery = debouncedQuery.trim().length >= 1;
  const hasResults =
    data &&
    (data.profiles.length > 0 ||
      data.photos.length > 0 ||
      data.categories.length > 0 ||
      data.tags.length > 0);

  if (!hasQuery) {
    return (
      <div className={cn("p-4 text-center text-exibidos-muted text-sm", className)}>
        <p>{PLACEHOLDER}</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className={cn("p-4 text-center text-exibidos-magenta text-sm", className)}>
        <p>Não foi possível buscar. Tente novamente.</p>
      </div>
    );
  }

  if (isLoading || isFetching) {
    return (
      <div className={cn("space-y-4 p-4", className)}>
        <SkeletonSection title="Perfis" />
        <SkeletonSection title="Fotos" />
        <SkeletonSection title="Categorias" />
        <SkeletonSection title="Tags" />
      </div>
    );
  }

  if (!data || !hasResults) {
    return (
      <div className={cn("space-y-4 p-4", className)}>
        <p className="text-center text-exibidos-muted text-sm">Nenhum resultado para &quot;{debouncedQuery}&quot;</p>
        {onSeeAll && (
          <div className="flex justify-center">
            <button
              type="button"
              onClick={onSeeAll}
              className="text-exibidos-purple text-sm font-medium hover:underline"
            >
              Ver busca avançada
            </button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={cn("space-y-4 p-4", className)}>
      {data.profiles.length > 0 && (
        <section>
          <SectionTitle>Perfis</SectionTitle>
          <ul className="space-y-1">
            {data.profiles.slice(0, 4).map((p) => (
              <li key={p.id}>
                <ProfileItem
                  slug={p.slug}
                  displayName={p.displayName}
                  highlight={p.displayName?.toLowerCase().includes(debouncedQuery.toLowerCase())}
                />
              </li>
            ))}
          </ul>
        </section>
      )}

      {data.photos.length > 0 && (
        <section>
          <SectionTitle>Fotos</SectionTitle>
          <div className="grid grid-cols-4 gap-2">
            {data.photos.slice(0, 4).map((p) => (
              <PhotoItem
                key={p.id}
                id={p.id}
                caption={p.caption}
                slug={p.slug}
                thumbUrl={p.thumbUrl}
              />
            ))}
          </div>
        </section>
      )}

      {data.categories.length > 0 && (
        <section>
          <SectionTitle>Categorias</SectionTitle>
          <div className="grid grid-cols-2 gap-2">
            {data.categories.slice(0, 4).map((c) => (
              <CategoryItem key={c.id} name={c.name} slug={c.slug} />
            ))}
          </div>
        </section>
      )}

      {data.tags.length > 0 && (
        <section>
          <SectionTitle>Tags</SectionTitle>
          <div className="flex flex-wrap gap-2">
            {data.tags.slice(0, 6).map((t) => (
              <TagItem key={t.id} name={t.name} slug={t.slug} categoryId={t.categoryId} />
            ))}
          </div>
        </section>
      )}

      {onSeeAll && (
        <div className="border-t border-white/10 pt-3">
          <button
            type="button"
            onClick={onSeeAll}
            className="w-full rounded-full bg-exibidos-purple/20 py-2.5 text-sm font-semibold text-exibidos-purple transition-colors hover:bg-exibidos-purple/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-exibidos-purple"
          >
            Ver todos os resultados
          </button>
        </div>
      )}
    </div>
  );
}
