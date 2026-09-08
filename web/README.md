# MoMA Collection — Gallery Dashboard

An editorial, Pinterest-style dashboard for browsing The Museum of Modern
Art's public art collection dataset. Built with Next.js (App Router) and
shadcn/ui, meant to be deployed on Vercel.

This is a from-scratch reimagining of the Streamlit EDA app at the repo
root, using the same underlying dataset (`../data/Artworks.csv`).

## What's here

- **Gallery** (`/`) — a masonry grid of the ~91k cataloged works that have
  an image, with filters (department, classification, nationality, gender,
  creation-year range), free-text search, sort modes, and a "Shuffle" for a
  fresh randomized browse. Click a work to open its full record in a dialog,
  with a link back to moma.org.
- **Insights** (`/insights`) — a statistical portrait of the full 157k-row
  dataset: composition by department, gender attribution, creation decade
  and acquisition trends, top artists and nationalities.

## Data pipeline

The app doesn't read the CSV at runtime. `scripts/build-dataset.mjs` parses
`../data/Artworks.csv` once and writes three trimmed JSON files into `data/`:

- `artworks.json` — every artwork with an image (title, artist, dates,
  medium, dimensions, credit line, MoMA URL, image URL). Read server-side
  only, by `app/api/artworks/route.ts`, and filtered/sorted/paginated
  per-request from an in-memory array.
- `facets.json` — filter option lists with counts, imported directly by the
  client-side filter bar.
- `stats.json` — precomputed aggregates for the Insights page.

Re-run the build whenever the source CSV changes:

```bash
npm run build:data
```

## Develop

```bash
npm install
npm run build:data   # generates data/*.json from ../data/Artworks.csv
npm run dev
```

## Deploy

This app is designed to deploy on Vercel with no environment variables or
external database — the dataset ships as a bundled JSON file. Set the
project's root directory to `web/` when importing the repo into Vercel.

`next.config.ts` declares `outputFileTracingIncludes` so `data/artworks.json`
is included in the `/api/artworks` serverless function; the `/` and
`/insights` pages are fully static and don't touch that file.
