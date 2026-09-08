import { useEffect, useState } from "react";
import type { Facets } from "@/lib/types";

export function useFacets() {
  const [facets, setFacets] = useState<Facets | null>(null);

  useEffect(() => {
    fetch("/api/facets")
      .then((r) => r.json())
      .then(setFacets);
  }, []);

  return facets;
}
