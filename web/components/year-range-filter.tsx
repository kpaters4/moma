"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Slider } from "@/components/ui/slider";

export function YearRangeFilter({
  bounds,
  value,
  onChange,
}: {
  bounds: [number, number];
  value: [number, number] | null;
  onChange: (value: [number, number] | null) => void;
}) {
  const current = value ?? bounds;
  const [draft, setDraft] = useState(current);
  const active = value != null;

  return (
    <Popover
      onOpenChange={(open) => {
        if (open) setDraft(current);
      }}
    >
      <PopoverTrigger asChild>
        <Button
          variant={active ? "default" : "outline"}
          size="sm"
          className="h-8 gap-1.5 rounded-full px-3.5 text-xs"
        >
          {active ? `${current[0]}–${current[1]}` : "Year"}
          <ChevronDown className="size-3.5 opacity-70" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-72" align="start">
        <p className="mb-3 text-xs text-muted-foreground">Creation year</p>
        <Slider
          min={bounds[0]}
          max={bounds[1]}
          value={draft}
          onValueChange={(v) => setDraft(v as [number, number])}
          className="mb-2"
        />
        <div className="mb-4 flex items-center justify-between text-xs font-medium tabular-nums">
          <span>{draft[0]}</span>
          <span>{draft[1]}</span>
        </div>
        <div className="flex justify-end gap-2">
          {active && (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs"
              onClick={() => onChange(null)}
            >
              Reset
            </Button>
          )}
          <Button
            size="sm"
            className="h-7 text-xs"
            onClick={() =>
              onChange(
                draft[0] === bounds[0] && draft[1] === bounds[1] ? null : draft
              )
            }
          >
            Apply
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
