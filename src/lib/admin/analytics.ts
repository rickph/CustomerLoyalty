import { CONSTRUCT_SECTIONS, PROFILE_FIELDS } from "@/lib/survey/questionnaire";
import type { Option } from "@/lib/survey/types";

export type BarDatum = { label: string; value: number; count?: number };

type AnalyticsRow = {
  screening: Record<string, string>;
  demographics: Record<string, unknown> & { location?: { regionName?: string } };
  answers: Record<string, number>;
};

/** Mean score (1–5) per construct, averaged across all of that construct's items and all responses. */
export function computeConstructAverages(rows: AnalyticsRow[]): BarDatum[] {
  return CONSTRUCT_SECTIONS.map((section) => {
    const values: number[] = [];
    for (const row of rows) {
      for (const item of section.items) {
        const v = row.answers?.[item.id];
        if (typeof v === "number") values.push(v);
      }
    }
    const avg = values.length ? values.reduce((a, b) => a + b, 0) / values.length : 0;
    return { label: section.title, value: Math.round(avg * 10) / 10 };
  });
}

/** Response counts per option, in the questionnaire's defined order (not sorted by count). */
function breakdownBySource(
  rows: AnalyticsRow[],
  source: "screening" | "demographics",
  fieldId: string,
  options: Option[]
): BarDatum[] {
  const counts = new Map<string, number>();
  for (const row of rows) {
    const value = String((row[source] as Record<string, unknown>)?.[fieldId] ?? "");
    if (!value) continue;
    counts.set(value, (counts.get(value) ?? 0) + 1);
  }
  return options.map((opt) => ({
    label: opt.label,
    value: counts.get(opt.value) ?? 0,
  }));
}

export function computeDemographicBreakdowns(rows: AnalyticsRow[]) {
  return Object.values(PROFILE_FIELDS)
    .filter(
      (f): f is Extract<typeof f, { kind: "choice" }> =>
        f.kind === "choice" && f.id !== PROFILE_FIELDS.gymType.id
    )
    .map((f) => ({
      title: f.text,
      data: breakdownBySource(rows, "demographics", f.id, f.options as Option[]),
    }));
}

export function computeGymTypeBreakdown(rows: AnalyticsRow[]): BarDatum[] | null {
  const gymTypeField = PROFILE_FIELDS.gymType;
  if (gymTypeField.kind !== "choice") return null;
  return breakdownBySource(rows, "demographics", gymTypeField.id, gymTypeField.options);
}

export function computeRegionBreakdown(rows: { region_name: string | null }[]): BarDatum[] {
  const counts = new Map<string, number>();
  for (const row of rows) {
    const region = row.region_name || "Unknown";
    counts.set(region, (counts.get(region) ?? 0) + 1);
  }
  return Array.from(counts.entries())
    .map(([label, value]) => ({ label, value }))
    .sort((a, b) => b.value - a.value);
}
