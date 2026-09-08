"use client";

import { useState } from "react";
import type { Artwork } from "@/lib/types";
import { cn } from "@/lib/utils";

export function ArtworkCard({
  artwork,
  onSelect,
}: {
  artwork: Artwork;
  onSelect: (artwork: Artwork) => void;
}) {
  const [loaded, setLoaded] = useState(false);

  return (
    <button
      type="button"
      onClick={() => onSelect(artwork)}
      className="group relative block w-full overflow-hidden rounded-md bg-secondary text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <img
        src={artwork.imageUrl}
        alt={artwork.title}
        loading="lazy"
        decoding="async"
        onLoad={() => setLoaded(true)}
        className={cn(
          "w-full transition-all duration-700 ease-out",
          "group-hover:scale-[1.03]",
          loaded ? "opacity-100 blur-0" : "opacity-0 blur-sm"
        )}
      />
      {!loaded && (
        <div className="absolute inset-0 animate-pulse bg-gradient-to-br from-secondary to-muted" />
      )}

      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/80 via-black/0 to-black/0 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

      <span className="pointer-events-none absolute left-2.5 top-2.5 rounded-full bg-black/55 px-2.5 py-1 text-[10px] font-medium uppercase tracking-wide text-white opacity-0 backdrop-blur-sm transition-opacity duration-300 group-hover:opacity-100">
        {artwork.department}
      </span>

      <div className="pointer-events-none absolute inset-x-0 bottom-0 translate-y-1 p-3.5 opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100">
        <p className="font-serif-display text-[15px] italic leading-snug text-white line-clamp-2">
          {artwork.title}
        </p>
        <p className="mt-1 text-xs text-white/80">
          {artwork.artist}
          {artwork.year ? ` · ${artwork.year}` : ""}
        </p>
      </div>
    </button>
  );
}
