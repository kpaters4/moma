"use client";

import { Search, Shuffle, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FacetFilter } from "@/components/facet-filter";
import { YearRangeFilter } from "@/components/year-range-filter";
import type { Facets, FilterState, SortMode } from "@/lib/types";
import { EMPTY_FILTERS } from "@/lib/types";

const SORT_OPTIONS: { value: SortMode; label: string }[] = [
  { value: "featured", label: "Featured" },
  { value: "acquired-desc", label: "Recently acquired" },
  { value: "acquired-asc", label: "Earliest acquired" },
  { value: "year-desc", label: "Newest artwork" },
  { value: "year-asc", label: "Oldest artwork" },
  { value: "artist-asc", label: "Artist, A–Z" },
];

export function FilterBar({
  facets,
  filters,
  onChange,
  onShuffle,
  resultCount,
}: {
  facets: Facets;
  filters: FilterState;
  onChange: (filters: FilterState) => void;
  onShuffle: () => void;
  resultCount: number | null;
}) {
  const activeCount =
    filters.department.length +
    filters.classification.length +
    filters.nationality.length +
    filters.gender.length +
    (filters.yearRange ? 1 : 0) +
    (filters.q ? 1 : 0);

  return (
    <div className="border-b border-border bg-background/95">
      <div className="mx-auto flex max-w-[1600px] flex-col gap-3 px-5 py-3.5 sm:px-8">
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative w-full max-w-xs sm:w-56">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={filters.q}
              onChange={(e) => onChange({ ...filters, q: e.target.value })}
              placeholder="Search title or artist…"
              className="h-8 rounded-full pl-8 text-xs"
            />
          </div>

          <FacetFilter
            label="Department"
            options={facets.departments}
            selected={filters.department}
            onChange={(v) => onChange({ ...filters, department: v })}
          />
          <FacetFilter
            label="Classification"
            options={facets.classifications}
            selected={filters.classification}
            onChange={(v) => onChange({ ...filters, classification: v })}
            searchable
          />
          <FacetFilter
            label="Nationality"
            options={facets.nationalities}
            selected={filters.nationality}
            onChange={(v) => onChange({ ...filters, nationality: v })}
            searchable
          />
          <FacetFilter
            label="Gender"
            options={facets.genders}
            selected={filters.gender}
            onChange={(v) => onChange({ ...filters, gender: v })}
          />
          <YearRangeFilter
            bounds={facets.yearRange}
            value={filters.yearRange}
            onChange={(v) => onChange({ ...filters, yearRange: v })}
          />

          {activeCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="h-8 gap-1 rounded-full px-2.5 text-xs text-muted-foreground"
              onClick={() => onChange(EMPTY_FILTERS)}
            >
              <X className="size-3.5" />
              Clear
            </Button>
          )}

          <div className="ml-auto flex items-center gap-2">
            <span className="hidden text-xs text-muted-foreground sm:inline">
              {resultCount != null ? `${resultCount.toLocaleString()} works` : "…"}
            </span>

            <Button
              variant="outline"
              size="sm"
              className="h-8 gap-1.5 rounded-full px-3 text-xs"
              onClick={onShuffle}
              disabled={filters.sort !== "featured"}
              title={
                filters.sort !== "featured"
                  ? "Switch sort to Featured to shuffle"
                  : "Shuffle the featured order"
              }
            >
              <Shuffle className="size-3.5" />
              Shuffle
            </Button>

            <Select
              value={filters.sort}
              onValueChange={(v) => onChange({ ...filters, sort: v as SortMode })}
            >
              <SelectTrigger size="default" className="rounded-full text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent align="end">
                {SORT_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>
    </div>
  );
}
