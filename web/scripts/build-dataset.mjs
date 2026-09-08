// Builds the trimmed JSON dataset the app reads at runtime from the raw MoMA
// CSV. Run with `npm run build:data` whenever ../../data/Artworks.csv changes.
import { createReadStream } from "node:fs";
import { writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { parse } from "csv-parse";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CSV_PATH = path.join(__dirname, "..", "..", "data", "Artworks.csv");
const OUT_DIR = path.join(__dirname, "..", "data");

const YEAR_RE = /(1[5-9]\d{2}|20[0-2]\d)/;

function extractYear(raw) {
  if (!raw) return null;
  const match = YEAR_RE.exec(raw);
  return match ? Number(match[1]) : null;
}

function firstParenValue(raw) {
  if (!raw) return "Unknown";
  const matches = raw.matchAll(/\(([^)]*)\)/g);
  for (const m of matches) {
    // Nested parens (e.g. "(female (transwoman))") leave a dangling "("
    // in the capture since the regex isn't paren-aware — drop it.
    const val = m[1].split("(")[0].trim();
    if (val) return titleCase(val);
  }
  return "Unknown";
}

function titleCase(s) {
  return s.replace(
    /\w\S*/g,
    (t) => t.charAt(0).toUpperCase() + t.slice(1).toLowerCase()
  );
}

function clean(raw, fallback = "Unknown") {
  if (!raw || !raw.trim()) return fallback;
  return raw.trim();
}

function acquiredYear(raw) {
  if (!raw) return null;
  const y = Number(raw.slice(0, 4));
  return Number.isFinite(y) && y > 1900 && y < 2100 ? y : null;
}

console.log("Reading", CSV_PATH);

const parser = createReadStream(CSV_PATH).pipe(
  parse({
    columns: true,
    relax_quotes: true,
    relax_column_count: true,
    skip_empty_lines: true,
  })
);

const artworks = [];
let totalRows = 0;
let withImages = 0;

const departmentCounts = new Map();
const classificationCounts = new Map();
const genderCounts = new Map();
const nationalityCounts = new Map();
const artistCounts = new Map();
const decadeCounts = new Map();
const acquisitionYearCounts = new Map();
const mediumCounts = new Map();
const artistSet = new Set();
let minYear = Infinity;
let maxYear = -Infinity;

function bump(map, key) {
  map.set(key, (map.get(key) ?? 0) + 1);
}

for await (const row of parser) {
  totalRows++;

  const department = clean(row.Department);
  const classification =
    clean(row.Classification) === "(not assigned)"
      ? "Unknown"
      : clean(row.Classification);
  const artist = clean(row.Artist);
  const gender = firstParenValue(row.Gender);
  const nationality = firstParenValue(row.Nationality);
  const year = extractYear(row.Date);
  const medium = clean(row.Medium, "");
  const accYear = acquiredYear(row.DateAcquired);

  bump(departmentCounts, department);
  bump(classificationCounts, classification);
  bump(genderCounts, gender);
  bump(nationalityCounts, nationality);
  if (artist !== "Unknown") {
    bump(artistCounts, artist);
    artistSet.add(artist);
  }
  if (medium) bump(mediumCounts, medium);
  if (year) {
    const decade = Math.floor(year / 10) * 10;
    bump(decadeCounts, decade);
    if (year < minYear) minYear = year;
    if (year > maxYear) maxYear = year;
  }
  if (accYear) bump(acquisitionYearCounts, accYear);

  const imageUrl = row.ImageURL && row.ImageURL.trim();
  if (!imageUrl) continue;
  withImages++;

  artworks.push({
    id: Number(row.ObjectID),
    title: clean(row.Title, "Untitled"),
    artist,
    nationality,
    gender,
    date: clean(row.Date, ""),
    year,
    medium,
    dimensions: clean(row.Dimensions, ""),
    department,
    classification,
    creditLine: clean(row.CreditLine, ""),
    momaUrl: clean(row.URL, ""),
    imageUrl,
    acquiredYear: accYear,
  });
}

console.log(`Parsed ${totalRows} rows, ${withImages} with images.`);

function sortedEntries(map) {
  return [...map.entries()].sort((a, b) => b[1] - a[1]);
}

const facets = {
  departments: sortedEntries(departmentCounts).map(([value, count]) => ({
    value,
    count,
  })),
  classifications: sortedEntries(classificationCounts)
    .slice(0, 40)
    .map(([value, count]) => ({ value, count })),
  genders: sortedEntries(genderCounts).map(([value, count]) => ({
    value,
    count,
  })),
  nationalities: sortedEntries(nationalityCounts)
    .slice(0, 60)
    .map(([value, count]) => ({ value, count })),
  yearRange: [minYear, maxYear],
};

const stats = {
  totalArtworks: totalRows,
  totalWithImages: withImages,
  totalArtists: artistSet.size,
  yearRange: [minYear, maxYear],
  departmentCounts: sortedEntries(departmentCounts).map(([name, count]) => ({
    name,
    count,
  })),
  classificationCounts: sortedEntries(classificationCounts)
    .slice(0, 10)
    .map(([name, count]) => ({ name, count })),
  genderCounts: sortedEntries(genderCounts).map(([name, count]) => ({
    name,
    count,
  })),
  nationalityCounts: sortedEntries(nationalityCounts)
    .slice(0, 12)
    .map(([name, count]) => ({ name, count })),
  topArtists: sortedEntries(artistCounts)
    .slice(0, 15)
    .map(([name, count]) => ({ name, count })),
  topMediums: sortedEntries(mediumCounts)
    .slice(0, 12)
    .map(([name, count]) => ({ name, count })),
  decadeCounts: sortedEntries(decadeCounts)
    .map(([decade, count]) => ({ decade, count }))
    .sort((a, b) => a.decade - b.decade)
    .filter((d) => d.decade >= 1800),
  acquisitionsByYear: sortedEntries(acquisitionYearCounts)
    .map(([year, count]) => ({ year, count }))
    .sort((a, b) => a.year - b.year),
};

await writeFile(
  path.join(OUT_DIR, "artworks.json"),
  JSON.stringify(artworks)
);
await writeFile(path.join(OUT_DIR, "facets.json"), JSON.stringify(facets, null, 2));
await writeFile(path.join(OUT_DIR, "stats.json"), JSON.stringify(stats, null, 2));

console.log("Wrote data/artworks.json, data/facets.json, data/stats.json");
