"""One-off loader: reads data/Artworks.csv and loads it into a Supabase
Postgres `artworks` table.

Usage:
    DATABASE_URL=postgresql://... uv run python scripts/seed_supabase.py

DATABASE_URL is never read from a file in this repo - pass it as an env var
(e.g. from your shell, or `supabase` CLI output) so it never gets committed.
"""

import io
import os
import sys
from pathlib import Path

import pandas as pd
import psycopg

DATA_PATH = Path(__file__).parent.parent / "data" / "Artworks.csv"

NUMERIC_COLUMNS = [
    "Circumference (cm)",
    "Depth (cm)",
    "Diameter (cm)",
    "Height (cm)",
    "Length (cm)",
    "Weight (kg)",
    "Width (cm)",
    "Seat Height (cm)",
    "Duration (sec.)",
]

# (CSV column, DB column) in the order the `artworks` table expects them.
COLUMN_MAP = [
    ("ObjectID", "object_id"),
    ("Title", "title"),
    ("Artist", "artist"),
    ("ConstituentID", "constituent_id"),
    ("ArtistBio", "artist_bio"),
    ("Nationality", "nationality"),
    ("BeginDate", "begin_date"),
    ("EndDate", "end_date"),
    ("Gender", "gender"),
    ("Date", "date"),
    ("Medium", "medium"),
    ("Dimensions", "dimensions"),
    ("CreditLine", "credit_line"),
    ("AccessionNumber", "accession_number"),
    ("Classification", "classification"),
    ("Department", "department"),
    ("DateAcquired", "date_acquired"),
    ("Cataloged", "cataloged"),
    ("URL", "url"),
    ("ImageURL", "image_url"),
    ("OnView", "on_view"),
    ("Circumference (cm)", "circumference_cm"),
    ("Depth (cm)", "depth_cm"),
    ("Diameter (cm)", "diameter_cm"),
    ("Height (cm)", "height_cm"),
    ("Length (cm)", "length_cm"),
    ("Weight (kg)", "weight_kg"),
    ("Width (cm)", "width_cm"),
    ("Seat Height (cm)", "seat_height_cm"),
    ("Duration (sec.)", "duration_sec"),
]

CREATE_TABLE_SQL = """
create table if not exists artworks (
    object_id bigint primary key,
    title text,
    artist text,
    constituent_id text,
    artist_bio text,
    nationality text,
    begin_date text,
    end_date text,
    gender text,
    date text,
    medium text,
    dimensions text,
    credit_line text,
    accession_number text,
    classification text,
    department text,
    date_acquired date,
    cataloged text,
    url text,
    image_url text,
    on_view text,
    circumference_cm double precision,
    depth_cm double precision,
    diameter_cm double precision,
    height_cm double precision,
    length_cm double precision,
    weight_kg double precision,
    width_cm double precision,
    seat_height_cm double precision,
    duration_sec double precision
);
"""


def load_dataframe() -> pd.DataFrame:
    df = pd.read_csv(DATA_PATH, dtype=str, low_memory=False)
    for col in NUMERIC_COLUMNS:
        df[col] = pd.to_numeric(df[col], errors="coerce")
    df["DateAcquired"] = pd.to_datetime(df["DateAcquired"], errors="coerce").dt.date
    return df


def main() -> None:
    database_url = os.environ.get("DATABASE_URL")
    if not database_url:
        print("Set DATABASE_URL in the environment before running this script.", file=sys.stderr)
        sys.exit(1)

    df = load_dataframe()
    csv_columns = [csv_col for csv_col, _ in COLUMN_MAP]
    db_columns = [db_col for _, db_col in COLUMN_MAP]
    df = df[csv_columns]

    buffer = io.StringIO()
    df.to_csv(buffer, index=False, header=False, na_rep="")
    buffer.seek(0)

    with psycopg.connect(database_url) as conn:
        with conn.cursor() as cur:
            cur.execute(CREATE_TABLE_SQL)
            cur.execute("truncate table artworks")
            column_list = ", ".join(db_columns)
            with cur.copy(f"copy artworks ({column_list}) from stdin with (format csv)") as copy:
                copy.write(buffer.read())
        conn.commit()

    print(f"Loaded {len(df):,} rows into artworks.")


if __name__ == "__main__":
    main()
