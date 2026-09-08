import { NextResponse } from "next/server";
import { getStats } from "@/lib/stats";

export async function GET() {
  const stats = await getStats();
  return NextResponse.json(stats, {
    headers: { "Cache-Control": "public, max-age=0, s-maxage=3600, stale-while-revalidate=86400" },
  });
}
