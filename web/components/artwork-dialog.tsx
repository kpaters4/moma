"use client";

import { ExternalLink } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import type { Artwork } from "@/lib/types";

export function ArtworkDialog({
  artwork,
  onOpenChange,
}: {
  artwork: Artwork | null;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <Dialog open={!!artwork} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton
        className="max-h-[92vh] gap-0 overflow-y-auto p-0 sm:max-w-3xl"
      >
        {artwork && (
          <div className="grid sm:grid-cols-[1.1fr_1fr]">
            <div className="flex items-center justify-center bg-secondary p-4 sm:p-6">
              <img
                src={artwork.imageUrl}
                alt={artwork.title}
                className="max-h-[70vh] w-auto max-w-full rounded-sm object-contain shadow-sm"
              />
            </div>

            <div className="flex flex-col gap-4 p-6 sm:p-7">
              <DialogHeader className="items-start gap-1.5 text-left">
                <Badge variant="secondary" className="mb-1 rounded-full text-[10px] uppercase tracking-wide">
                  {artwork.department}
                </Badge>
                <DialogTitle asChild>
                  <h2 className="font-serif-display text-2xl italic leading-tight">
                    {artwork.title}
                  </h2>
                </DialogTitle>
                <p className="text-sm text-muted-foreground">
                  {artwork.artist}
                  {artwork.nationality !== "Unknown" ? `, ${artwork.nationality}` : ""}
                  {artwork.date ? ` · ${artwork.date}` : ""}
                </p>
              </DialogHeader>

              <dl className="grid grid-cols-1 gap-3 border-t border-border pt-4 text-sm">
                {artwork.medium && (
                  <Field label="Medium" value={artwork.medium} />
                )}
                {artwork.dimensions && (
                  <Field label="Dimensions" value={artwork.dimensions} />
                )}
                <Field label="Classification" value={artwork.classification} />
                {artwork.creditLine && (
                  <Field label="Credit" value={artwork.creditLine} />
                )}
                {artwork.acquiredYear && (
                  <Field label="Acquired" value={String(artwork.acquiredYear)} />
                )}
              </dl>

              {artwork.momaUrl && (
                <a
                  href={artwork.momaUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-1 inline-flex w-fit items-center gap-1.5 rounded-full border border-border px-4 py-2 text-xs font-medium uppercase tracking-wide transition-colors hover:bg-accent"
                >
                  View at moma.org
                  <ExternalLink className="size-3.5" />
                </a>
              )}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-[11px] uppercase tracking-wide text-muted-foreground">
        {label}
      </dt>
      <dd className="mt-0.5 leading-snug">{value}</dd>
    </div>
  );
}
