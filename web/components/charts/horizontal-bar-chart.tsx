"use client";

import type { ReactNode } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  LabelList,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

interface Datum {
  name: string;
  count: number;
}

export function HorizontalBarChart({
  data,
  height = 340,
  color = "var(--chart-1)",
}: {
  data: Datum[];
  height?: number;
  color?: string;
}) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart
        data={data}
        layout="vertical"
        margin={{ top: 4, right: 36, bottom: 4, left: 4 }}
        barCategoryGap={10}
      >
        <CartesianGrid
          horizontal={false}
          stroke="var(--border)"
          strokeDasharray="0"
        />
        <XAxis
          type="number"
          tickFormatter={(v) => Intl.NumberFormat("en", { notation: "compact" }).format(v)}
          tick={{ fill: "var(--muted-foreground)", fontSize: 11 }}
          axisLine={{ stroke: "var(--border)" }}
          tickLine={false}
        />
        <YAxis
          type="category"
          dataKey="name"
          width={150}
          tick={{ fill: "var(--foreground)", fontSize: 12 }}
          axisLine={false}
          tickLine={false}
        />
        <Tooltip
          cursor={{ fill: "var(--muted)" }}
          contentStyle={{
            background: "var(--popover)",
            border: "1px solid var(--border)",
            borderRadius: 8,
            fontSize: 12,
            color: "var(--popover-foreground)",
          }}
          formatter={(value) => [Number(value).toLocaleString(), "Artworks"]}
        />
        <Bar dataKey="count" fill={color} radius={[0, 4, 4, 0]} maxBarSize={22}>
          <LabelList
            dataKey="count"
            position="right"
            style={{ fill: "var(--muted-foreground)", fontSize: 11 }}
            formatter={(v: ReactNode) =>
              Intl.NumberFormat("en", { notation: "compact" }).format(Number(v))
            }
          />
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
