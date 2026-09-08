// One-off migration: adds cleaned/derived columns to the existing Supabase
// `artworks` table (seeded by ../../scripts/seed_supabase.py) so the app can
// filter, sort, and aggregate in SQL instead of re-deriving them from raw
// CSV-shaped text on every request.
//
// Derives, per row:
//   gender_primary       - first non-empty "(value)" in `gender`, title-cased
//   nationality_primary  - same, from `nationality`
//   creation_year        - first 4-digit year (1500-2029) found in `date`
//   decade               - creation_year rounded down to the decade
//   acquired_year        - year part of the existing `date_acquired` date
//
// Usage:
//   DATABASE_URL=postgresql://... node scripts/migrate-derived-columns.mjs
import postgres from "postgres";

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  console.error("Set DATABASE_URL in the environment before running this script.");
  process.exit(1);
}

const sql = postgres(databaseUrl, { ssl: "require", max: 3 });

const YEAR_RE = /(1[5-9]\d{2}|20[0-2]\d)/;

function extractYear(raw) {
  if (!raw) return null;
  const match = YEAR_RE.exec(raw);
  return match ? Number(match[1]) : null;
}

function titleCase(s) {
  return s.replace(/\w\S*/g, (t) => t.charAt(0).toUpperCase() + t.slice(1).toLowerCase());
}

function firstParenValue(raw) {
  if (!raw) return "Unknown";
  const matches = raw.matchAll(/\(([^)]*)\)/g);
  for (const m of matches) {
    // Nested parens (e.g. "(female (transwoman))") leave a dangling "("
    // in the capture since the regex isn't paren-aware - drop it.
    const val = m[1].split("(")[0].trim();
    if (val) return titleCase(val);
  }
  return "Unknown";
}

async function main() {
  console.log("Adding derived columns (if missing)...");
  await sql`
    alter table artworks
      add column if not exists gender_primary text,
      add column if not exists nationality_primary text,
      add column if not exists creation_year integer,
      add column if not exists decade integer,
      add column if not exists acquired_year integer
  `;

  console.log("Reading raw columns...");
  const rows = await sql`
    select object_id, gender, nationality, date, date_acquired from artworks
  `;
  console.log(`Computing derived values for ${rows.length.toLocaleString()} rows...`);

  const computed = rows.map((r) => {
    const creationYear = extractYear(r.date);
    return {
      object_id: r.object_id,
      gender_primary: firstParenValue(r.gender),
      nationality_primary: firstParenValue(r.nationality),
      creation_year: creationYear,
      decade: creationYear != null ? Math.floor(creationYear / 10) * 10 : null,
      acquired_year: r.date_acquired ? new Date(r.date_acquired).getUTCFullYear() : null,
    };
  });

  const BATCH_SIZE = 2000;
  for (let i = 0; i < computed.length; i += BATCH_SIZE) {
    const batch = computed.slice(i, i + BATCH_SIZE);
    await sql`
      update artworks as a set
        gender_primary = v.gender_primary,
        nationality_primary = v.nationality_primary,
        creation_year = v.creation_year,
        decade = v.decade,
        acquired_year = v.acquired_year
      from (values ${sql(
        batch.map((r) => [
          r.object_id,
          r.gender_primary,
          r.nationality_primary,
          r.creation_year,
          r.decade,
          r.acquired_year,
        ])
      )}) as v(object_id, gender_primary, nationality_primary, creation_year, decade, acquired_year)
      where a.object_id = v.object_id::bigint
    `;
    console.log(`  updated ${Math.min(i + BATCH_SIZE, computed.length).toLocaleString()} / ${computed.length.toLocaleString()}`);
  }

  console.log("Creating indexes...");
  await sql`create index if not exists idx_artworks_department on artworks (department)`;
  await sql`create index if not exists idx_artworks_classification on artworks (classification)`;
  await sql`create index if not exists idx_artworks_gender_primary on artworks (gender_primary)`;
  await sql`create index if not exists idx_artworks_nationality_primary on artworks (nationality_primary)`;
  await sql`create index if not exists idx_artworks_creation_year on artworks (creation_year)`;
  await sql`create index if not exists idx_artworks_has_image on artworks (object_id) where image_url is not null`;

  try {
    await sql`create extension if not exists pg_trgm`;
    await sql`create index if not exists idx_artworks_title_trgm on artworks using gin (title gin_trgm_ops)`;
    await sql`create index if not exists idx_artworks_artist_trgm on artworks using gin (artist gin_trgm_ops)`;
    console.log("Trigram search indexes created.");
  } catch (err) {
    console.warn(
      "Skipped trigram search indexes (pg_trgm extension not available on this plan):",
      err.message
    );
  }

  console.log("Done.");
  await sql.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
