import { NextResponse } from "next/server";
import { getFacets } from "@/lib/facets";

export async function GET() {
  const facets = await getFacets();
  return NextResponse.json(facets, {
    headers: { "Cache-Control": "public, max-age=0, s-maxage=3600, stale-while-revalidate=86400" },
  });
}
