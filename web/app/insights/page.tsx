import statsData from "@/data/stats.json";
import { StatTile } from "@/components/charts/stat-tile";
import { HorizontalBarChart } from "@/components/charts/horizontal-bar-chart";
import { TrendLineChart } from "@/components/charts/trend-line-chart";
import { GenderComposition } from "@/components/charts/gender-composition";
import { Card } from "@/components/ui/card";

interface Stats {
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

const stats = statsData as Stats;

function fold(name: string) {
  if (name === "Male" || name === "Female" || name === "Unknown") return name;
  return "Other";
}

export default function InsightsPage() {
  const genderFolded = new Map<string, number>();
  for (const g of stats.genderCounts) {
    genderFolded.set(fold(g.name), (genderFolded.get(fold(g.name)) ?? 0) + g.count);
  }
  const genderSegments = [
    { label: "Male", count: genderFolded.get("Male") ?? 0, color: "var(--chart-1)" },
    { label: "Female", count: genderFolded.get("Female") ?? 0, color: "var(--chart-2)" },
    { label: "Other", count: genderFolded.get("Other") ?? 0, color: "var(--chart-3)" },
    { label: "Unknown", count: genderFolded.get("Unknown") ?? 0, color: "var(--muted-foreground)" },
  ].filter((s) => s.count > 0);

  return (
    <main className="mx-auto w-full max-w-[1600px] flex-1 px-5 py-10 sm:px-8">
      <p className="text-xs font-medium uppercase tracking-[0.25em] text-brand">
        Collection Insights
      </p>
      <h1 className="mt-3 max-w-2xl font-serif-display text-4xl leading-[1.05] tracking-tight sm:text-5xl">
        The shape of the archive.
      </h1>
      <p className="mt-4 max-w-xl text-sm leading-relaxed text-muted-foreground">
        A statistical portrait of the full public collection dataset — every
        cataloged work, not just the ones with images.
      </p>

      <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatTile label="Artworks cataloged" value={stats.totalArtworks.toLocaleString()} />
        <StatTile label="Artists represented" value={stats.totalArtists.toLocaleString()} />
        <StatTile
          label="With images"
          value={`${Math.round((stats.totalWithImages / stats.totalArtworks) * 100)}%`}
          hint={`${stats.totalWithImages.toLocaleString()} works`}
        />
        <StatTile
          label="Creation years span"
          value={`${stats.yearRange[0]}–${stats.yearRange[1]}`}
        />
      </div>

      <div className="mt-10 grid gap-5 lg:grid-cols-2">
        <Card className="rounded-lg border-border/80 p-5 shadow-none">
          <ChartHeading
            title="Collection by department"
            caption="Drawings & Prints dominates the catalog by sheer volume of editioned works."
          />
          <HorizontalBarChart
            data={stats.departmentCounts.map((d) => ({ name: d.name, count: d.count }))}
            height={280}
          />
        </Card>

        <Card className="rounded-lg border-border/80 p-5 shadow-none">
          <ChartHeading
            title="Artist gender composition"
            caption="Attribution reflects the historical record and cataloging practice, not museum policy today."
          />
          <div className="flex h-[280px] flex-col justify-center">
            <GenderComposition segments={genderSegments} />
          </div>
        </Card>

        <Card className="rounded-lg border-border/80 p-5 shadow-none lg:col-span-2">
          <ChartHeading
            title="Artworks by decade created"
            caption="A postwar surge in acquisitions of works from the 1960s and 70s — largely prints and photographs."
          />
          <TrendLineChart
            data={stats.decadeCounts.map((d) => ({ x: `${d.decade}s`, y: d.count }))}
            height={260}
          />
        </Card>

        <Card className="rounded-lg border-border/80 p-5 shadow-none lg:col-span-2">
          <ChartHeading
            title="Acquisitions per year"
            caption="Cataloged acquisition dates, by calendar year."
          />
          <TrendLineChart
            data={stats.acquisitionsByYear.map((d) => ({ x: d.year, y: d.count }))}
            height={240}
            color="var(--chart-2)"
          />
        </Card>

        <Card className="rounded-lg border-border/80 p-5 shadow-none">
          <ChartHeading title="Top artists by number of works" />
          <HorizontalBarChart
            data={stats.topArtists.slice(0, 10).map((d) => ({ name: d.name, count: d.count }))}
            height={340}
            color="var(--chart-3)"
          />
        </Card>

        <Card className="rounded-lg border-border/80 p-5 shadow-none">
          <ChartHeading title="Top nationalities represented" />
          <HorizontalBarChart
            data={stats.nationalityCounts
              .filter((d) => d.name !== "Unknown")
              .slice(0, 10)
              .map((d) => ({ name: d.name, count: d.count }))}
            height={340}
            color="var(--chart-4)"
          />
        </Card>
      </div>
    </main>
  );
}

function ChartHeading({ title, caption }: { title: string; caption?: string }) {
  return (
    <div className="mb-4">
      <h2 className="font-serif-display text-lg italic">{title}</h2>
      {caption && <p className="mt-1 text-xs text-muted-foreground">{caption}</p>}
    </div>
  );
}
