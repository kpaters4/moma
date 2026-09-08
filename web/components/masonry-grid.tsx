"use client";

import { useMemo } from "react";
import type { Artwork } from "@/lib/types";
import { ArtworkCard } from "@/components/artwork-card";
import { useColumnCount } from "@/hooks/use-column-count";

// CSS multi-column (`columns-N`) balances auto-height columns by filling
// column 1 to some estimated height before spilling to column 2, which (for
// content that streams in via infinite scroll / async image loads) leaves
// later columns visibly empty. Distributing into explicit flex columns
// avoids that entirely.
export function MasonryGrid({
  artworks,
  onSelect,
}: {
  artworks: Artwork[];
  onSelect: (artwork: Artwork) => void;
}) {
  const columnCount = useColumnCount();

  const columns = useMemo(() => {
    const cols: Artwork[][] = Array.from({ length: columnCount }, () => []);
    artworks.forEach((artwork, i) => {
      cols[i % columnCount].push(artwork);
    });
    return cols;
  }, [artworks, columnCount]);

  return (
    <div className="flex gap-4">
      {columns.map((col, i) => (
        <div key={i} className="flex flex-1 flex-col gap-4">
          {col.map((artwork) => (
            <ArtworkCard key={artwork.id} artwork={artwork} onSelect={onSelect} />
          ))}
        </div>
      ))}
    </div>
  );
}
