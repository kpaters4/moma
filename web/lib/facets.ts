import { sql } from "@/lib/db";
import type { Facets } from "@/lib/types";

async function topValues(
  column: "department" | "gender_primary" | "nationality_primary",
  limit?: number
) {
  return sql<{ value: string; count: number }[]>`
    select coalesce(${sql(column)}, 'Unknown') as value, count(*)::int as count
    from artworks
    where image_url is not null
    group by 1
    order by count desc
    ${limit ? sql`limit ${limit}` : sql``}
  `;
}

async function topClassifications(limit: number) {
  return sql<{ value: string; count: number }[]>`
    select
      case
        when classification is null or classification = '(not assigned)' then 'Unknown'
        else classification
      end as value,
      count(*)::int as count
    from artworks
    where image_url is not null
    group by 1
    order by count desc
    limit ${limit}
  `;
}

export async function getFacets(): Promise<Facets> {
  // Sequential, not Promise.all: Supabase's transaction-mode pooler can hand
  // concurrent pipelined queries on one connection to different backends,
  // which confuses postgres.js's response matching and hangs. See lib/db.ts.
  const departments = await topValues("department");
  const classifications = await topClassifications(40);
  const genders = await topValues("gender_primary");
  const nationalities = await topValues("nationality_primary", 60);
  const [range] = await sql<{ min: number; max: number }[]>`
    select min(creation_year)::int as min, max(creation_year)::int as max
    from artworks
    where image_url is not null and creation_year is not null
  `;

  return {
    departments,
    classifications,
    genders,
    nationalities,
    yearRange: [range.min, range.max],
  };
}
