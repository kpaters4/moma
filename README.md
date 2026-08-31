# MoMA Collection EDA

A Streamlit app for exploring The Museum of Modern Art's public art collection
dataset (`data/Artworks.csv`, ~157k artworks).

**Data Source:** [MoMA Art Collection Dataset](https://www.kaggle.com/datasets/lalit7881/the-museum-of-modern-art-moma-collection)

**Live App:** [moma-eda.streamlit.app](https://moma-eda.streamlit.app)

**Also deployed on Modal:** [kpaters4--moma-eda-run.modal.run](https://kpaters4--moma-eda-run.modal.run)

## Setup

Requires [uv](https://docs.astral.sh/uv/).

```bash
uv sync
```

## Run

```bash
uv run streamlit run app.py
```

This opens the app at `http://localhost:8501`.

## Deploy on Modal

`modal_app.py` packages this app (code and `.streamlit/` theme) into a Modal
image and serves it with `@modal.web_server`. The deployed app reads its data
from Supabase (see below) instead of the local CSV.

```bash
uv run modal token new     # one-time auth, opens a browser login
uv run modal serve modal_app.py     # ephemeral preview, live-reloads on changes
uv run modal deploy modal_app.py    # persistent deployment, prints the public URL
```

Modal credentials are stored in `~/.modal.toml` (outside the repo) and must
never be committed — don't paste API tokens into code, config files, or
commit messages. `.gitignore` blacklists a stray `.modal.toml`/`.env` as a
backstop, but the token should simply never end up in a repo-tracked file.

> **Windows note:** set `PYTHONUTF8=1` before running `modal` commands, or the
> CLI's checkmark/emoji output can crash with a `charmap` codec error in
> consoles that default to a non-UTF-8 codepage.

## Data source: Supabase

The full dataset also lives in a Supabase Postgres project (`artworks` table,
one row per artwork — see `scripts/seed_supabase.py` for the schema and
loader). `app.py`'s `load_data()` checks for a `DATABASE_URL` env var:

- **Not set** (default, local dev) — reads `data/Artworks.csv` directly, same
  as before.
- **Set** — queries Supabase instead. This is how the Modal deployment gets
  its data; the Modal image no longer bundles the CSV.

The connection string is stored as a Modal Secret (`moma-eda-db`), never in
the repo:

```bash
uv run modal secret create moma-eda-db DATABASE_URL=<connection-string>
```

To re-seed the table after a data refresh, run the loader locally with the
connection string in the environment (never commit it, never put it in a
tracked file):

```bash
DATABASE_URL=<connection-string> uv run python scripts/seed_supabase.py
```

Use the **session pooler** connection string (`aws-0-<region>.pooler.supabase.com:5432`,
user `postgres.<project-ref>`) rather than the direct `db.<project-ref>.supabase.co`
host — the direct host requires IPv6, which Modal's containers don't have.

## What's in the app

- **Overview** — a treemap of collection composition (department → top
  classifications) and summary stats for physical dimensions
- **Categories** — artworks by department/classification, gender mix by department
- **Mediums** — top mediums by number of works, and the growing diversity of
  distinct mediums used per decade
- **Artists & Nationality** — top artists, top nationalities, gender breakdown
- **Time Trends** — acquisitions per year, artworks created per decade
- **Dimensions** — height/width/weight distributions, a height-vs-width scatter
  by department, and a correlation heatmap
- **Data Explorer** — search, column picker, and CSV download of the filtered data

Sidebar filters (department, classification, artist gender, nationality, creation
year range) apply across every tab.

## Screenshots

**Overview**
![Overview tab](docs/screenshots/overview.jpg)

**Categories**
![Categories tab](docs/screenshots/categories.jpg)

**Mediums**
![Mediums tab](docs/screenshots/mediums.jpg)

**Artists & Nationality**
![Artists & Nationality tab](docs/screenshots/artists_nationality.jpg)

**Time Trends**
![Time Trends tab](docs/screenshots/time_trends.jpg)

**Dimensions**
![Dimensions tab](docs/screenshots/dimensions.jpg)

**Data Explorer**
![Data Explorer tab](docs/screenshots/data_explorer.jpg)
