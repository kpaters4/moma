import { sql } from "@/lib/db";

export interface Stats {
  totalArtworks: number;
  totalWithImages: number;
  totalArtists: number;
  yearRange: [number, number];
  departmentCounts: { name: string; count: number }[];
  classificationCounts: { name: string; count: number }[];
  genderCounts: { name: string; count: number }[];
  nationalityCounts: { name: string; count: number }[];
  topArtists: { name: string; count: number }[];
  topMediums: { name: string; count: number }[];
  decadeCounts: { decade: number; count: number }[];
  acquisitionsByYear: { year: number; count: number }[];
}

export async function getStats(): Promise<Stats> {
  // Sequential, not Promise.all: Supabase's transaction-mode pooler can hand
  // concurrent pipelined queries on one connection to different backends,
  // which confuses postgres.js's response matching and hangs. See lib/db.ts.
  const [{ count: totalArtworks }] = await sql<{ count: number }[]>`
    select count(*)::int as count from artworks
  `;
  const [{ count: totalWithImages }] = await sql<{ count: number }[]>`
    select count(*)::int as count from artworks where image_url is not null
  `;
  const [{ count: totalArtists }] = await sql<{ count: number }[]>`
    select count(distinct artist)::int as count from artworks
    where artist is not null and artist <> ''
  `;
  const [yearRange] = await sql<{ min: number; max: number }[]>`
    select min(creation_year)::int as min, max(creation_year)::int as max
    from artworks where creation_year is not null
  `;
  const departmentCounts = await sql<{ name: string; count: number }[]>`
    select coalesce(department, 'Unknown') as name, count(*)::int as count
    from artworks group by 1 order by count desc
  `;
  const classificationCounts = await sql<{ name: string; count: number }[]>`
    select
      case when classification is null or classification = '(not assigned)' then 'Unknown'
           else classification end as name,
      count(*)::int as count
    from artworks group by 1 order by count desc limit 10
  `;
  const genderCounts = await sql<{ name: string; count: number }[]>`
    select coalesce(gender_primary, 'Unknown') as name, count(*)::int as count
    from artworks group by 1 order by count desc
  `;
  const nationalityCounts = await sql<{ name: string; count: number }[]>`
    select coalesce(nationality_primary, 'Unknown') as name, count(*)::int as count
    from artworks group by 1 order by count desc limit 12
  `;
  const topArtists = await sql<{ name: string; count: number }[]>`
    select artist as name, count(*)::int as count
    from artworks where artist is not null and artist <> ''
    group by 1 order by count desc limit 15
  `;
  const topMediums = await sql<{ name: string; count: number }[]>`
    select medium as name, count(*)::int as count
    from artworks where medium is not null and medium <> ''
    group by 1 order by count desc limit 12
  `;
  const decadeCounts = await sql<{ decade: number; count: number }[]>`
    select decade, count(*)::int as count
    from artworks where decade is not null and decade >= 1800
    group by 1 order by 1
  `;
  const acquisitionsByYear = await sql<{ year: number; count: number }[]>`
    select acquired_year as year, count(*)::int as count
    from artworks where acquired_year is not null
    group by 1 order by 1
  `;

  return {
    totalArtworks,
    totalWithImages,
    totalArtists,
    yearRange: [yearRange.min, yearRange.max],
    departmentCounts,
    classificationCounts,
    genderCounts,
    nationalityCounts,
    topArtists,
    topMediums,
    decadeCounts,
    acquisitionsByYear,
  };
}
