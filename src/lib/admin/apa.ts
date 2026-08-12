/**
 * APA 7th-edition number formatting.
 *
 * The two rules that matter most for a results chapter:
 *  - Statistics that cannot exceed 1 in absolute value (r, p, alpha, beta,
 *    R-squared) are written without a leading zero: `.62`, not `0.62`.
 *  - Everything else keeps its leading zero: `M = 3.94`.
 */

/** Formats a value that can exceed 1 (M, SD, t, F, b, SE). */
export function apaNumber(value: number, digits = 2): string {
  if (!Number.isFinite(value)) return "—";
  return value.toFixed(digits);
}

/** Formats a bounded statistic (r, alpha, beta, R²) with the leading zero stripped. */
export function apaBounded(value: number, digits = 2): string {
  if (!Number.isFinite(value)) return "—";
  const sign = value < 0 ? "-" : "";
  const body = Math.abs(value).toFixed(digits);
  return sign + (body.startsWith("0.") ? body.slice(1) : body);
}

/** APA p value: three decimals, no leading zero, and `< .001` at the floor. */
export function apaP(p: number): string {
  if (!Number.isFinite(p)) return "—";
  if (p < 0.001) return "< .001";
  return `= ${apaBounded(p, 3)}`;
}

/** Bare p value for a table cell, where the column header already says "p". */
export function apaPCell(p: number): string {
  if (!Number.isFinite(p)) return "—";
  return p < 0.001 ? "< .001" : apaBounded(p, 3);
}

/** Conventional significance flags. Always paired with the exact p in the table. */
export function significanceStars(p: number): string {
  if (!Number.isFinite(p)) return "";
  if (p < 0.001) return "***";
  if (p < 0.01) return "**";
  if (p < 0.05) return "*";
  return "";
}

/**
 * The manuscript's five-band interpretation of a mean on the 1–5 Likert scale
 * (Chapter 3, Scoring Guide). Kept here so the dashboard and the thesis use
 * identical wording.
 */
export const MEAN_BANDS = [
  { min: 4.21, max: 5.0, label: "Very High" },
  { min: 3.41, max: 4.2, label: "High" },
  { min: 2.61, max: 3.4, label: "Moderate" },
  { min: 1.81, max: 2.6, label: "Low" },
  { min: 1.0, max: 1.8, label: "Very Low" },
] as const;

export function interpretMean(value: number): string {
  if (!Number.isFinite(value)) return "—";
  for (const band of MEAN_BANDS) {
    if (value >= band.min) return band.label;
  }
  return "Very Low";
}

/** George & Mallery's rule-of-thumb bands for Cronbach's alpha. */
export function interpretAlpha(alpha: number): string {
  if (!Number.isFinite(alpha)) return "—";
  if (alpha >= 0.9) return "Excellent";
  if (alpha >= 0.8) return "Good";
  if (alpha >= 0.7) return "Acceptable";
  if (alpha >= 0.6) return "Questionable";
  if (alpha >= 0.5) return "Poor";
  return "Unacceptable";
}

/** Percentage to one decimal, as used in APA frequency tables. */
export function apaPercent(count: number, total: number): string {
  if (!total) return "—";
  return `${((count / total) * 100).toFixed(1)}`;
}
