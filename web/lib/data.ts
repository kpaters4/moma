import artworksData from "@/data/artworks.json";
import type { Artwork, SortMode } from "@/lib/types";

// A static import (rather than a runtime fs read) so the bundler traces and
// includes the data file in the deployed function automatically.
const all = artworksData as Artwork[];

function hashOrder(id: number, seed: number): number {
  let h = (id * 2654435761) ^ seed;
  h = Math.imul(h ^ (h >>> 16), 2246822519);
  h = Math.imul(h ^ (h >>> 13), 3266489917);
  h = (h ^ (h >>> 16)) >>> 0;
  return h;
}

export interface QueryParams {
  q?: string;
  department?: string[];
  classification?: string[];
  nationality?: string[];
  gender?: string[];
  yearMin?: number;
  yearMax?: number;
  sort?: SortMode;
  seed?: number;
  offset?: number;
  limit?: number;
}

export function queryArtworks(params: QueryParams) {
  const {
    q,
    department,
    classification,
    nationality,
    gender,
    yearMin,
    yearMax,
    sort = "featured",
    seed = 0,
    offset = 0,
    limit = 36,
  } = params;

  const query = q?.trim().toLowerCase();
  const deptSet = department?.length ? new Set(department) : null;
  const classSet = classification?.length ? new Set(classification) : null;
  const natSet = nationality?.length ? new Set(nationality) : null;
  const genderSet = gender?.length ? new Set(gender) : null;

  let filtered = all.filter((a) => {
    if (deptSet && !deptSet.has(a.department)) return false;
    if (classSet && !classSet.has(a.classification)) return false;
    if (natSet && !natSet.has(a.nationality)) return false;
    if (genderSet && !genderSet.has(a.gender)) return false;
    if (yearMin != null && yearMax != null) {
      if (a.year == null) return false;
      if (a.year < yearMin || a.year > yearMax) return false;
    }
    if (query) {
      const hay = `${a.title} ${a.artist}`.toLowerCase();
      if (!hay.includes(query)) return false;
    }
    return true;
  });

  switch (sort) {
    case "acquired-desc":
      filtered = filtered
        .slice()
        .sort((a, b) => (b.acquiredYear ?? -1) - (a.acquiredYear ?? -1));
      break;
    case "acquired-asc":
      filtered = filtered
        .slice()
        .sort(
          (a, b) =>
            (a.acquiredYear ?? Infinity) - (b.acquiredYear ?? Infinity)
        );
      break;
    case "year-desc":
      filtered = filtered.slice().sort((a, b) => (b.year ?? -1) - (a.year ?? -1));
      break;
    case "year-asc":
      filtered = filtered
        .slice()
        .sort((a, b) => (a.year ?? Infinity) - (b.year ?? Infinity));
      break;
    case "artist-asc":
      filtered = filtered.slice().sort((a, b) => a.artist.localeCompare(b.artist));
      break;
    case "featured":
    default:
      filtered = filtered
        .slice()
        .sort((a, b) => hashOrder(a.id, seed) - hashOrder(b.id, seed));
      break;
  }

  const total = filtered.length;
  const items = filtered.slice(offset, offset + limit);
  const nextOffset = offset + items.length < total ? offset + items.length : null;

  return { items, total, nextOffset };
}
