import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { Artwork, ArtworksResponse, FilterState } from "@/lib/types";

function buildQuery(filters: FilterState, seed: number, offset: number) {
  const params = new URLSearchParams();
  if (filters.q) params.set("q", filters.q);
  if (filters.department.length) params.set("department", filters.department.join(","));
  if (filters.classification.length)
    params.set("classification", filters.classification.join(","));
  if (filters.nationality.length) params.set("nationality", filters.nationality.join(","));
  if (filters.gender.length) params.set("gender", filters.gender.join(","));
  if (filters.yearRange) {
    params.set("yearMin", String(filters.yearRange[0]));
    params.set("yearMax", String(filters.yearRange[1]));
  }
  params.set("sort", filters.sort);
  params.set("seed", String(seed));
  params.set("offset", String(offset));
  params.set("limit", "36");
  return params.toString();
}

interface Result {
  key: string;
  items: Artwork[];
  total: number;
  nextOffset: number | null;
}

export function useArtworks(filters: FilterState) {
  const [seed, setSeed] = useState(() => Math.floor(Math.random() * 2 ** 31));
  const [result, setResult] = useState<Result | null>(null);
  const [loadingMore, setLoadingMore] = useState(false);
  const requestId = useRef(0);

  const filterKey = useMemo(() => JSON.stringify(filters), [filters]);
  const requestKey = `${filterKey}|${seed}`;
  const loading = result?.key !== requestKey;

  useEffect(() => {
    const id = ++requestId.current;
    fetch(`/api/artworks?${buildQuery(filters, seed, 0)}`)
      .then((r) => r.json())
      .then((data: ArtworksResponse) => {
        if (id !== requestId.current) return;
        setResult({
          key: requestKey,
          items: data.items,
          total: data.total,
          nextOffset: data.nextOffset,
        });
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [requestKey]);

  const loadMore = useCallback(() => {
    if (loadingMore || !result || result.nextOffset == null) return;
    const id = requestId.current;
    const currentKey = result.key;
    const offset = result.nextOffset;
    setLoadingMore(true);
    fetch(`/api/artworks?${buildQuery(filters, seed, offset)}`)
      .then((r) => r.json())
      .then((data: ArtworksResponse) => {
        if (id !== requestId.current) return;
        setResult((prev) =>
          prev && prev.key === currentKey
            ? {
                key: currentKey,
                items: [...prev.items, ...data.items],
                total: data.total,
                nextOffset: data.nextOffset,
              }
            : prev
        );
      })
      .finally(() => setLoadingMore(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [result, loadingMore, filterKey, seed]);

  const reshuffle = useCallback(() => {
    setSeed(Math.floor(Math.random() * 2 ** 31));
  }, []);

  return {
    items: result?.items ?? [],
    total: result?.total ?? null,
    loading,
    loadingMore,
    hasMore: result?.nextOffset != null,
    loadMore,
    reshuffle,
  };
}
