import { Card } from "@/components/ui/card";

export function StatTile({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <Card className="gap-1.5 rounded-lg border-border/80 p-5 shadow-none">
      <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="font-sans text-3xl font-semibold tracking-tight">{value}</p>
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </Card>
  );
}
