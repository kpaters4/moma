"use client";

interface Segment {
  label: string;
  count: number;
  color: string;
}

export function GenderComposition({ segments }: { segments: Segment[] }) {
  const total = segments.reduce((sum, s) => sum + s.count, 0);

  return (
    <div>
      <div className="flex h-8 w-full overflow-hidden rounded-full">
        {segments.map((s, i) => {
          const pct = (s.count / total) * 100;
          if (pct <= 0) return null;
          return (
            <div
              key={s.label}
              style={{
                width: `${pct}%`,
                backgroundColor: s.color,
                marginLeft: i === 0 ? 0 : 2,
              }}
              title={`${s.label}: ${s.count.toLocaleString()} (${pct.toFixed(1)}%)`}
            />
          );
        })}
      </div>
      <div className="mt-4 flex flex-wrap gap-x-6 gap-y-2">
        {segments.map((s) => (
          <div key={s.label} className="flex items-center gap-2 text-xs">
            <span
              className="size-2.5 rounded-full"
              style={{ backgroundColor: s.color }}
            />
            <span className="text-foreground">{s.label}</span>
            <span className="text-muted-foreground">
              {((s.count / total) * 100).toFixed(1)}% · {s.count.toLocaleString()}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
