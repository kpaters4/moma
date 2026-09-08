import { sql } from "@/lib/db";
import type { Artwork, SortMode } from "@/lib/types";

export interface QueryParams {
  q?: string;
  department?: string[];
  classification?: string[];
  nationality?: string[];
  gender?: string[];
  yearMin?: number;
  yearMax?: number;
  sort?: SortMode;
  seed?: number;
  offset?: number;
  limit?: number;
}

function orderClause(sort: SortMode, seed: number) {
  switch (sort) {
    case "acquired-desc":
      return sql`order by acquired_year desc nulls last, object_id`;
    case "acquired-asc":
      return sql`order by acquired_year asc nulls last, object_id`;
    case "year-desc":
      return sql`order by creation_year desc nulls last, object_id`;
    case "year-asc":
      return sql`order by creation_year asc nulls last, object_id`;
    case "artist-asc":
      return sql`order by artist asc, object_id`;
    case "featured":
    default:
      // A seed-keyed hash gives a stable-but-shuffled order: same seed
      // paginates consistently, a new seed ("Shuffle") reorders everything.
      return sql`order by md5(object_id::text || ${String(seed)})`;
  }
}

export async function queryArtworks(params: QueryParams) {
  const {
    q,
    department,
    classification,
    nationality,
    gender,
    yearMin,
    yearMax,
    sort = "featured",
    seed = 0,
    offset = 0,
    limit = 36,
  } = params;

  const conditions = [sql`image_url is not null`];
  if (department?.length) conditions.push(sql`department = any(${department})`);
  if (classification?.length)
    conditions.push(sql`classification = any(${classification})`);
  if (nationality?.length)
    conditions.push(sql`nationality_primary = any(${nationality})`);
  if (gender?.length) conditions.push(sql`gender_primary = any(${gender})`);
  if (yearMin != null && yearMax != null) {
    conditions.push(sql`creation_year between ${yearMin} and ${yearMax}`);
  }
  const query = q?.trim();
  if (query) {
    const like = `%${query}%`;
    conditions.push(sql`(title ilike ${like} or artist ilike ${like})`);
  }

  const whereClause = conditions.reduce((acc, c) => sql`${acc} and ${c}`);

  const rows = await sql<
    (Artwork & { totalCount: number })[]
  >`
    select
      object_id::int as id,
      coalesce(title, 'Untitled') as title,
      coalesce(artist, 'Unknown') as artist,
      coalesce(nationality_primary, 'Unknown') as nationality,
      coalesce(gender_primary, 'Unknown') as gender,
      coalesce(date, '') as date,
      creation_year as year,
      coalesce(medium, '') as medium,
      coalesce(dimensions, '') as dimensions,
      coalesce(department, 'Unknown') as department,
      case
        when classification is null or classification = '(not assigned)' then 'Unknown'
        else classification
      end as classification,
      coalesce(credit_line, '') as "creditLine",
      coalesce(url, '') as "momaUrl",
      image_url as "imageUrl",
      acquired_year as "acquiredYear",
      count(*) over()::int as "totalCount"
    from artworks
    where ${whereClause}
    ${orderClause(sort, seed)}
    limit ${limit} offset ${offset}
  `;

  const total = rows[0]?.totalCount ?? 0;
  const items: Artwork[] = rows.map((row) => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { totalCount, ...artwork } = row;
    return artwork;
  });
  const nextOffset = offset + items.length < total ? offset + items.length : null;

  return { items, total, nextOffset };
}
