"use client";

import { useState } from "react";
import { Check, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { cn } from "@/lib/utils";
import type { FacetOption } from "@/lib/types";

export function FacetFilter({
  label,
  options,
  selected,
  onChange,
  searchable = false,
}: {
  label: string;
  options: FacetOption[];
  selected: string[];
  onChange: (values: string[]) => void;
  searchable?: boolean;
}) {
  const [open, setOpen] = useState(false);

  function toggle(value: string) {
    if (selected.includes(value)) {
      onChange(selected.filter((v) => v !== value));
    } else {
      onChange([...selected, value]);
    }
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant={selected.length ? "default" : "outline"}
          size="sm"
          className="h-8 gap-1.5 rounded-full px-3.5 text-xs"
        >
          {label}
          {selected.length > 0 && (
            <span className="rounded-full bg-background/25 px-1.5 text-[10px]">
              {selected.length}
            </span>
          )}
          <ChevronDown className="size-3.5 opacity-70" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-64 p-0" align="start">
        <Command>
          {searchable && <CommandInput placeholder={`Search ${label.toLowerCase()}…`} />}
          <CommandList className="max-h-72">
            <CommandEmpty>No results.</CommandEmpty>
            <CommandGroup>
              {options.map((opt) => {
                const isSelected = selected.includes(opt.value);
                return (
                  <CommandItem
                    key={opt.value}
                    value={opt.value}
                    onSelect={() => toggle(opt.value)}
                    className="justify-between text-xs"
                  >
                    <span className="flex items-center gap-2 truncate">
                      <span
                        className={cn(
                          "flex size-3.5 items-center justify-center rounded-sm border border-border",
                          isSelected && "border-foreground bg-foreground text-background"
                        )}
                      >
                        {isSelected && <Check className="size-3" />}
                      </span>
                      <span className="truncate">{opt.value}</span>
                    </span>
                    <span className="shrink-0 text-[10px] text-muted-foreground">
                      {opt.count.toLocaleString()}
                    </span>
                  </CommandItem>
                );
              })}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
