/**
 * Dashboard filters.
 *
 * One filter set scopes the whole page — every table, chart and export reads
 * the same slice, so a number on screen always matches the file you download.
 * State lives in the URL so a filtered view can be bookmarked or pasted to an
 * adviser, and so the export links can carry the same query string.
 */

import { PROFILE_FIELDS } from "@/lib/survey/questionnaire";
import type { Option } from "@/lib/survey/types";

export type Period = "all" | "7d" | "30d" | "90d";

export type Filters = {
  period: Period;
  region: string;
  gymType: string;
  visitFrequency: string;
};

export const DEFAULT_FILTERS: Filters = {
  period: "all",
  region: "all",
  gymType: "all",
  visitFrequency: "all",
};

export const PERIOD_OPTIONS: { value: Period; label: string }[] = [
  { value: "all", label: "All time" },
  { value: "90d", label: "Last 90 days" },
  { value: "30d", label: "Last 30 days" },
  { value: "7d", label: "Last 7 days" },
];

const PERIOD_DAYS: Record<Period, number | null> = {
  all: null,
  "7d": 7,
  "30d": 30,
  "90d": 90,
};

export function gymTypeOptions(): Option[] {
  const field = PROFILE_FIELDS.gymType;
  return field.kind === "choice" ? field.options : [];
}

export function visitFrequencyOptions(): Option[] {
  const field = PROFILE_FIELDS.visitFrequency;
  return field.kind === "choice" ? field.options : [];
}

type SearchParams = Record<string, string | string[] | undefined>;

function one(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

/** Reads filters out of a URL query, falling back to "all" for anything unrecognised. */
export function parseFilters(params: SearchParams): Filters {
  const period = one(params.period);
  const gymType = one(params.gym);
  const visitFrequency = one(params.freq);
  const region = one(params.region);

  const validPeriod = PERIOD_OPTIONS.some((p) => p.value === period);
  const validGym = gymTypeOptions().some((o) => o.value === gymType);
  const validFreq = visitFrequencyOptions().some((o) => o.value === visitFrequency);

  return {
    period: validPeriod ? (period as Period) : "all",
    gymType: validGym ? gymType! : "all",
    visitFrequency: validFreq ? visitFrequency! : "all",
    // Region names come from the data rather than a fixed list, so anything
    // non-empty is accepted and simply matches nothing if it's bogus.
    region: region && region.trim() ? region : "all",
  };
}

export function filtersToQuery(filters: Filters): string {
  const q = new URLSearchParams();
  if (filters.period !== "all") q.set("period", filters.period);
  if (filters.region !== "all") q.set("region", filters.region);
  if (filters.gymType !== "all") q.set("gym", filters.gymType);
  if (filters.visitFrequency !== "all") q.set("freq", filters.visitFrequency);
  const s = q.toString();
  return s ? `?${s}` : "";
}

export function isFiltered(filters: Filters): boolean {
  return (
    filters.period !== "all" ||
    filters.region !== "all" ||
    filters.gymType !== "all" ||
    filters.visitFrequency !== "all"
  );
}

/** The minimum a row needs to be filterable, so the CSV and xlsx routes share this. */
type FilterableRow = {
  created_at: string;
  region_name?: string | null;
  demographics?: Record<string, unknown> | null;
};

/** Applies the filters in memory, so every consumer slices identically. */
export function applyFilters<T extends FilterableRow>(rows: T[], filters: Filters): T[] {
  const days = PERIOD_DAYS[filters.period];
  const cutoff = days === null ? null : Date.now() - days * 24 * 60 * 60 * 1000;
  const gymTypeId = PROFILE_FIELDS.gymType.id;
  const freqId = PROFILE_FIELDS.visitFrequency.id;

  return rows.filter((row) => {
    if (cutoff !== null) {
      const at = new Date(row.created_at).getTime();
      if (!Number.isFinite(at) || at < cutoff) return false;
    }
    if (filters.region !== "all") {
      // The CSV route reads rows that carry the region only inside the blob.
      const location = row.demographics?.location as { regionName?: string } | undefined;
      const region = row.region_name ?? location?.regionName ?? "";
      if (region !== filters.region) return false;
    }
    if (
      filters.gymType !== "all" &&
      String(row.demographics?.[gymTypeId] ?? "") !== filters.gymType
    ) {
      return false;
    }
    if (
      filters.visitFrequency !== "all" &&
      String(row.demographics?.[freqId] ?? "") !== filters.visitFrequency
    ) {
      return false;
    }
    return true;
  });
}

/** Human-readable summary, used in the exports so a file states its own scope. */
export function describeFilters(filters: Filters): string {
  if (!isFiltered(filters)) return "All responses";
  const parts: string[] = [];
  const period = PERIOD_OPTIONS.find((p) => p.value === filters.period);
  if (filters.period !== "all" && period) parts.push(period.label);
  if (filters.region !== "all") parts.push(`Region: ${filters.region}`);
  if (filters.gymType !== "all") {
    parts.push(
      `Gym type: ${gymTypeOptions().find((o) => o.value === filters.gymType)?.label ?? filters.gymType}`
    );
  }
  if (filters.visitFrequency !== "all") {
    parts.push(
      `Visit frequency: ${
        visitFrequencyOptions().find((o) => o.value === filters.visitFrequency)?.label ??
        filters.visitFrequency
      }`
    );
  }
  return parts.join(" · ");
}
