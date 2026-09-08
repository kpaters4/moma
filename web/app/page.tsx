"use client";

import { useEffect, useRef, useState } from "react";
import facetsData from "@/data/facets.json";
import { FilterBar } from "@/components/filter-bar";
import { MasonryGrid } from "@/components/masonry-grid";
import { ArtworkDialog } from "@/components/artwork-dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { useArtworks } from "@/hooks/use-artworks";
import { EMPTY_FILTERS } from "@/lib/types";
import type { Artwork, Facets, FilterState } from "@/lib/types";

const facets = facetsData as Facets;

export default function GalleryPage() {
  const [filters, setFilters] = useState<FilterState>(EMPTY_FILTERS);
  const [selected, setSelected] = useState<Artwork | null>(null);
  const { items, total, loading, loadingMore, hasMore, loadMore, reshuffle } =
    useArtworks(filters);

  const sentinelRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) loadMore();
      },
      { rootMargin: "800px" }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [loadMore]);

  return (
    <>
      <section className="mx-auto w-full max-w-[1600px] px-5 pt-10 pb-6 sm:px-8 sm:pt-14">
        <p className="text-xs font-medium uppercase tracking-[0.25em] text-brand">
          The Museum of Modern Art · Public Collection
        </p>
        <h1 className="mt-3 max-w-3xl font-serif-display text-4xl leading-[1.05] tracking-tight sm:text-5xl">
          A hundred and fifty thousand works,{" "}
          <span className="italic text-muted-foreground">arranged for wandering.</span>
        </h1>
        <p className="mt-4 max-w-xl text-sm leading-relaxed text-muted-foreground">
          Browse, filter, and shuffle through MoMA&rsquo;s public collection
          dataset — from Bauhaus blueprints to Fluxus ephemera. Every image
          links back to the museum&rsquo;s own record.
        </p>
      </section>

      <div className="sticky top-16 z-30">
        <FilterBar
          facets={facets}
          filters={filters}
          onChange={setFilters}
          onShuffle={reshuffle}
          resultCount={total}
        />
      </div>

      <main className="mx-auto w-full max-w-[1600px] flex-1 px-5 py-6 sm:px-8">
        {loading ? (
          <SkeletonGrid />
        ) : items.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 py-24 text-center">
            <p className="font-serif-display text-xl italic">No works match these filters.</p>
            <p className="text-sm text-muted-foreground">
              Try widening the year range or clearing a filter.
            </p>
          </div>
        ) : (
          <>
            <MasonryGrid artworks={items} onSelect={setSelected} />
            <div ref={sentinelRef} className="h-1" />
            {loadingMore && (
              <div className="grid grid-cols-2 gap-4 pt-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-56 w-full rounded-md" />
                ))}
              </div>
            )}
            {!hasMore && (
              <p className="py-10 text-center text-xs uppercase tracking-widest text-muted-foreground">
                End of the collection
              </p>
            )}
          </>
        )}
      </main>

      <ArtworkDialog artwork={selected} onOpenChange={(open) => !open && setSelected(null)} />
    </>
  );
}

const SKELETON_COL_VISIBILITY = [
  "",
  "",
  "hidden sm:flex",
  "hidden lg:flex",
  "hidden xl:flex",
];

function SkeletonGrid() {
  const heights = [220, 300, 260, 340, 200];
  return (
    <div className="flex gap-4">
      {SKELETON_COL_VISIBILITY.map((visibility, col) => (
        <div key={col} className={`flex-1 flex-col gap-4 ${visibility || "flex"}`}>
          {heights.map((h, i) => (
            <Skeleton
              key={i}
              className="w-full rounded-md"
              style={{ height: h }}
            />
          ))}
        </div>
      ))}
    </div>
  );
}
