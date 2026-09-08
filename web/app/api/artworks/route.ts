import { NextRequest, NextResponse } from "next/server";
import { queryArtworks } from "@/lib/data";
import type { SortMode } from "@/lib/types";

const SORT_MODES: SortMode[] = [
  "featured",
  "acquired-desc",
  "acquired-asc",
  "year-desc",
  "year-asc",
  "artist-asc",
];

function parseList(value: string | null): string[] | undefined {
  if (!value) return undefined;
  return value
    .split(",")
    .map((v) => v.trim())
    .filter(Boolean);
}

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;

  const sortParam = params.get("sort");
  const sort = SORT_MODES.includes(sortParam as SortMode)
    ? (sortParam as SortMode)
    : "featured";

  const yearMinRaw = params.get("yearMin");
  const yearMaxRaw = params.get("yearMax");

  const result = queryArtworks({
    q: params.get("q") ?? undefined,
    department: parseList(params.get("department")),
    classification: parseList(params.get("classification")),
    nationality: parseList(params.get("nationality")),
    gender: parseList(params.get("gender")),
    yearMin: yearMinRaw ? Number(yearMinRaw) : undefined,
    yearMax: yearMaxRaw ? Number(yearMaxRaw) : undefined,
    sort,
    seed: Number(params.get("seed") ?? 0) || 0,
    offset: Number(params.get("offset") ?? 0) || 0,
    limit: Math.min(Number(params.get("limit") ?? 36) || 36, 60),
  });

  return NextResponse.json(result);
}
