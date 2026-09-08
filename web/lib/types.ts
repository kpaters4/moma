export interface Artwork {
  id: number;
  title: string;
  artist: string;
  nationality: string;
  gender: string;
  date: string;
  year: number | null;
  medium: string;
  dimensions: string;
  department: string;
  classification: string;
  creditLine: string;
  momaUrl: string;
  imageUrl: string;
  acquiredYear: number | null;
}

export interface FacetOption {
  value: string;
  count: number;
}

export interface Facets {
  departments: FacetOption[];
  classifications: FacetOption[];
  genders: FacetOption[];
  nationalities: FacetOption[];
  yearRange: [number, number];
}

export interface ArtworksResponse {
  items: Artwork[];
  total: number;
  nextOffset: number | null;
}

export type SortMode =
  | "featured"
  | "acquired-desc"
  | "acquired-asc"
  | "year-desc"
  | "year-asc"
  | "artist-asc";

export interface FilterState {
  q: string;
  department: string[];
  classification: string[];
  nationality: string[];
  gender: string[];
  yearRange: [number, number] | null;
  sort: SortMode;
}

export const DEFAULT_SORT: SortMode = "featured";

export const EMPTY_FILTERS: FilterState = {
  q: "",
  department: [],
  classification: [],
  nationality: [],
  gender: [],
  yearRange: null,
  sort: DEFAULT_SORT,
};
