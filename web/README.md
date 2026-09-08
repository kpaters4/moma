# MoMA Collection — Gallery Dashboard

An editorial, Pinterest-style dashboard for browsing The Museum of Modern
Art's public art collection dataset. Built with Next.js (App Router) and
shadcn/ui, deployed on Vercel.

This is a from-scratch reimagining of the Streamlit EDA app at the repo
root. Both apps read from the **same Supabase Postgres database** the
Streamlit/Modal deployment uses (see the root `README.md`'s "Data source:
Supabase" section) — there's no separate copy of the dataset here.

## What's here

- **Gallery** (`/`) — a masonry grid of the ~91k cataloged works that have
  an image, with filters (department, classification, nationality, gender,
  creation-year range), free-text search, sort modes, and a "Shuffle" for a
  fresh randomized browse. Click a work to open its full record in a dialog,
  with a link back to moma.org.
- **Insights** (`/insights`) — a statistical portrait of the full 157k-row
  dataset: composition by department, gender attribution, creation decade
  and acquisition trends, top artists and nationalities.

## Data access

Every page fetches from this app's own API routes, which query Postgres
directly with the [`postgres`](https://github.com/porsager/postgres) client
(`lib/db.ts`):

- **`/api/artworks`** — filters, sorts, and paginates the `artworks` table
  in SQL per request (`lib/data.ts`). The gallery's "Shuffle" is a
  seed-keyed `ORDER BY md5(object_id || seed)`, so a given seed paginates
  consistently and a new one reshuffles everything.
- **`/api/facets`** — filter-dropdown option lists with counts
  (`lib/facets.ts`), CDN-cached for an hour since they change rarely.
- **`/api/stats`** — the aggregates behind the Insights charts
  (`lib/stats.ts`), same caching.

The raw `artworks` table (seeded by `../scripts/seed_supabase.py`) stores
CSV-shaped text columns — `gender`, `nationality`, and `date` need cleanup
(e.g. `gender` looks like `"(male) (male)"` for multi-artist works) before
they're useful for filtering. Rather than re-deriving that on every
request, `scripts/migrate-derived-columns.mjs` is a one-time migration that
adds and backfills `gender_primary`, `nationality_primary`, `creation_year`,
`decade`, and `acquired_year` columns (plus indexes) — run it once against
the database:

```bash
DATABASE_URL=postgresql://... npm run migrate:db
```

Re-run it if the source data is reloaded via `seed_supabase.py`.

## Develop

```bash
cp .env.example .env.local   # fill in DATABASE_URL
npm install
npm run dev
```

`DATABASE_URL` is the same connection string used by the Modal deployment —
use the session or transaction pooler host (not `db.<ref>.supabase.co`,
which requires IPv6).

## Deploy

Set the Vercel project's **Root Directory** to `web/`. For the database
connection, either:

- Install the [Supabase Vercel integration](https://vercel.com/integrations/supabase)
  and connect it to this project — it provisions `POSTGRES_URL` (among
  others) automatically, which `lib/db.ts` reads as a fallback for
  `DATABASE_URL`. By default the integration only scopes its variables to
  **Production** — add **Preview** and **Development** too (Project
  Settings → Environment Variables → edit each `POSTGRES_*`/`SUPABASE_*`
  row) if you want those environments to hit the database as well.
- Or add `DATABASE_URL` as a project environment variable yourself
  (Production, Preview, and Development).

Every page here fetches from API routes at request time, so nothing needs
database access at build time.
