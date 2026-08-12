import type { BarDatum } from "@/lib/admin/analytics";

type BarListProps = {
  data: BarDatum[];
  /** Fixed scale max (e.g. 5 for a Likert average). Omit to scale to the largest value in the list. */
  max?: number;
  /** How to render the value at the end of each bar. */
  valueFormat?: (value: number, total: number) => string;
  /** CSS colour for the fill. Defaults to the first series hue. */
  color?: string;
};

/**
 * Horizontal bar list: single brand hue (these are all single-series
 * magnitude comparisons, not multi-series identity, so no categorical
 * palette is needed), value always shown as text so the data is never
 * hover-only.
 */
export function BarList({ data, max, valueFormat, color = "var(--series-quality)" }: BarListProps) {
  const total = data.reduce((sum, d) => sum + d.value, 0);
  const scaleMax = max ?? Math.max(1, ...data.map((d) => d.value));

  if (data.every((d) => d.value === 0)) {
    return <p className="text-sm text-foreground/50">No data yet.</p>;
  }

  return (
    <div className="flex flex-col gap-2.5">
      {data.map((d) => {
        const pct = Math.min(100, (d.value / scaleMax) * 100);
        const label = valueFormat ? valueFormat(d.value, total) : String(d.value);
        return (
          <div key={d.label} className="group" title={`${d.label}: ${label}`}>
            <div className="flex items-baseline justify-between gap-3 text-sm mb-1">
              <span className="text-foreground/80">{d.label}</span>
              <span className="text-foreground/50 tabular-nums shrink-0">{label}</span>
            </div>
            <div className="h-2.5 w-full rounded-full bg-border overflow-hidden">
              <div
                className="h-full rounded-full transition-[width] group-hover:opacity-80"
                style={{ width: `${pct}%`, background: color }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
