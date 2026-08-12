/**
 * Turns raw survey rows into the statistical tables the results chapter needs.
 *
 * Scores are built the way the manuscript specifies: a dimension score is the
 * mean of that dimension's items for one respondent, and a construct score is
 * the mean of every item belonging to that construct. Respondents missing an
 * item are excluded from that scale only (listwise within the scale), which is
 * what SPSS does by default.
 */

import { CONSTRUCT_SECTIONS, PROFILE_FIELDS } from "@/lib/survey/questionnaire";
import type { Option } from "@/lib/survey/types";
import {
  cronbachAlpha,
  linearRegression,
  mean,
  mediationAnalysis,
  pearson,
  sd,
  type CorrelationResult,
  type MediationResult,
  type RegressionResult,
} from "./statistics";

export type RawRow = {
  created_at: string;
  region_name: string | null;
  screening: Record<string, string>;
  demographics: Record<string, unknown>;
  answers: Record<string, number>;
};

/** The four constructs, in questionnaire order. */
export const CONSTRUCTS: string[] = Array.from(
  CONSTRUCT_SECTIONS.reduce<Set<string>>((set, s) => set.add(s.part), new Set())
);

export const OUTCOME = "Customer Loyalty";
export const MEDIATOR = "Trust";
/** The two exogenous constructs the hypotheses treat as predictors. */
export const PREDICTORS = CONSTRUCTS.filter((c) => c !== OUTCOME && c !== MEDIATOR);

function itemIdsFor(part: string): string[] {
  return CONSTRUCT_SECTIONS.filter((s) => s.part === part).flatMap((s) =>
    s.items.map((i) => i.id)
  );
}

/** Mean of the given item ids for one respondent, or NaN if any is unanswered. */
function scaleScore(answers: Record<string, number>, ids: string[]): number {
  const values: number[] = [];
  for (const id of ids) {
    const v = answers?.[id];
    if (typeof v !== "number" || !Number.isFinite(v)) return NaN;
    values.push(v);
  }
  return values.length ? mean(values) : NaN;
}

export type ScoredRow = {
  createdAt: string;
  regionName: string | null;
  demographics: Record<string, unknown>;
  /** dimension (section) id -> scale score */
  dimension: Record<string, number>;
  /** construct name -> scale score */
  construct: Record<string, number>;
};

export function scoreResponses(rows: RawRow[]): ScoredRow[] {
  return rows.map((row) => {
    const dimension: Record<string, number> = {};
    for (const section of CONSTRUCT_SECTIONS) {
      dimension[section.id] = scaleScore(
        row.answers,
        section.items.map((i) => i.id)
      );
    }
    const construct: Record<string, number> = {};
    for (const part of CONSTRUCTS) {
      construct[part] = scaleScore(row.answers, itemIdsFor(part));
    }
    return {
      createdAt: row.created_at,
      regionName: row.region_name,
      demographics: row.demographics ?? {},
      dimension,
      construct,
    };
  });
}

function column(scored: ScoredRow[], pick: (r: ScoredRow) => number): number[] {
  return scored.map(pick).filter((v) => Number.isFinite(v));
}

// ------------------------------------------------------------- descriptives

export type DescriptiveRow = {
  label: string;
  /** Set on dimension rows so the table can indent them under their construct. */
  parent?: string;
  n: number;
  mean: number;
  sd: number;
};

export function buildDescriptives(scored: ScoredRow[]): DescriptiveRow[] {
  const out: DescriptiveRow[] = [];
  for (const part of CONSTRUCTS) {
    const values = column(scored, (r) => r.construct[part]);
    out.push({ label: part, n: values.length, mean: mean(values), sd: sd(values) });

    for (const section of CONSTRUCT_SECTIONS.filter((s) => s.part === part)) {
      const dimValues = column(scored, (r) => r.dimension[section.id]);
      // Section titles read "Service Quality — Tangibles"; the construct is
      // already the row above, so show only the dimension name.
      const short = section.title.includes("—")
        ? section.title.split("—").slice(1).join("—").trim()
        : section.title;
      out.push({
        label: short,
        parent: part,
        n: dimValues.length,
        mean: mean(dimValues),
        sd: sd(dimValues),
      });
    }
  }
  return out;
}

// -------------------------------------------------------------- reliability

export type ReliabilityRow = {
  label: string;
  items: number;
  n: number;
  alpha: number;
};

export function buildReliability(rows: RawRow[]): ReliabilityRow[] {
  return CONSTRUCTS.map((part) => {
    const ids = itemIdsFor(part);
    const matrix = rows.map((row) => ids.map((id) => row.answers?.[id] ?? NaN));
    const result = cronbachAlpha(matrix);
    return { label: part, items: ids.length, n: result.n, alpha: result.alpha };
  });
}

// -------------------------------------------------------------- correlation

export type CorrelationCell = CorrelationResult | null;

export type CorrelationMatrix = {
  labels: string[];
  /** Lower triangle; `cells[i][j]` is null on and above the diagonal. */
  cells: CorrelationCell[][];
};

export function buildCorrelationMatrix(scored: ScoredRow[]): CorrelationMatrix {
  const labels = CONSTRUCTS;
  const cells: CorrelationCell[][] = labels.map((rowName, i) =>
    labels.map((colName, j) => {
      if (j >= i) return null;
      return pearson(
        scored.map((r) => r.construct[rowName]),
        scored.map((r) => r.construct[colName])
      );
    })
  );
  return { labels, cells };
}

// --------------------------------------------------------------- regression

/** Customer loyalty regressed on the two exogenous constructs. */
export function buildRegression(scored: ScoredRow[]): RegressionResult | null {
  return linearRegression(
    scored.map((r) => r.construct[OUTCOME]),
    PREDICTORS.map((name) => ({ name, values: scored.map((r) => r.construct[name]) }))
  );
}

// ---------------------------------------------------------------- mediation

export type NamedMediation = {
  predictor: string;
  mediator: string;
  outcome: string;
  result: MediationResult;
};

export function buildMediations(scored: ScoredRow[]): NamedMediation[] {
  const out: NamedMediation[] = [];
  for (const predictor of PREDICTORS) {
    const result = mediationAnalysis(
      scored.map((r) => r.construct[predictor]),
      scored.map((r) => r.construct[MEDIATOR]),
      scored.map((r) => r.construct[OUTCOME])
    );
    if (result) {
      out.push({ predictor, mediator: MEDIATOR, outcome: OUTCOME, result });
    }
  }
  return out;
}

// -------------------------------------------------------------- frequencies

export type FrequencyRow = { label: string; count: number };
export type FrequencyTable = { title: string; rows: FrequencyRow[]; total: number };

/** Frequency and percentage for every closed-ended profile field, in questionnaire order. */
export function buildFrequencyTables(rows: RawRow[]): FrequencyTable[] {
  const tables: FrequencyTable[] = [];

  for (const field of Object.values(PROFILE_FIELDS)) {
    if (field.kind !== "choice") continue;
    const counts = new Map<string, number>();
    let total = 0;
    for (const row of rows) {
      const value = String(row.demographics?.[field.id] ?? "");
      if (!value) continue;
      counts.set(value, (counts.get(value) ?? 0) + 1);
      total++;
    }
    tables.push({
      title: field.text,
      total,
      rows: (field.options as Option[]).map((opt) => ({
        label: opt.label,
        count: counts.get(opt.value) ?? 0,
      })),
    });
  }

  // Region is stored in its own column rather than the demographics blob.
  const regionCounts = new Map<string, number>();
  let regionTotal = 0;
  for (const row of rows) {
    const name = row.region_name || "Not specified";
    regionCounts.set(name, (regionCounts.get(name) ?? 0) + 1);
    regionTotal++;
  }
  tables.push({
    title: "Administrative region",
    total: regionTotal,
    rows: Array.from(regionCounts.entries())
      .map(([label, count]) => ({ label, count }))
      .sort((a, b) => b.count - a.count),
  });

  return tables;
}

// ------------------------------------------------------------ response flow

export type DailyCount = { date: string; count: number };

/** Submissions per calendar day, gap-filled so the trend line has no holes. */
export function buildDailyCounts(rows: RawRow[], days = 30): DailyCount[] {
  const byDay = new Map<string, number>();
  for (const row of rows) {
    const key = new Date(row.created_at).toISOString().slice(0, 10);
    byDay.set(key, (byDay.get(key) ?? 0) + 1);
  }
  const out: DailyCount[] = [];
  const today = new Date();
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setUTCDate(d.getUTCDate() - i);
    const key = d.toISOString().slice(0, 10);
    out.push({ date: key, count: byDay.get(key) ?? 0 });
  }
  return out;
}
