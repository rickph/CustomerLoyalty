/**
 * Assembles the full Excel workbook: raw item-level responses on the first
 * sheet (what SPSS / SmartPLS need) followed by every computed table, so a
 * single download carries both the data and the results.
 */

import {
  CONSTRUCT_SECTIONS,
  LIKERT_SCALE,
  PROFILE_FIELDS,
  SCREENING_QUESTIONS,
} from "@/lib/survey/questionnaire";
import type { Option } from "@/lib/survey/types";
import { interpretAlpha, interpretMean } from "./apa";
import { describeFilters, type Filters } from "./filters";
import {
  buildCorrelationMatrix,
  buildDescriptives,
  buildFrequencyTables,
  buildMediations,
  buildRegression,
  buildReliability,
  CONSTRUCTS,
  OUTCOME,
  scoreResponses,
  type RawRow,
} from "./results";
import { buildWorkbook, type Cell, type Sheet } from "./xlsx";

const bold = (value: string | number): Cell => ({ value, bold: true });

/** Rounds for display without pretending to more precision than we have. */
function round(value: number, digits = 3): number | string {
  return Number.isFinite(value) ? Number(value.toFixed(digits)) : "";
}

/**
 * p values must not round to a flat 0 — "p = 0" is not a reportable result.
 * Significant digits are kept instead, so Excel shows e.g. 3.42E-18.
 */
function pValue(value: number): number | string {
  if (!Number.isFinite(value)) return "";
  if (value === 0) return 0;
  return value < 0.0005 ? Number(value.toPrecision(3)) : Number(value.toFixed(4));
}

/** Excel column reference (A, B, ... AA) for a zero-based index. */
function columnRef(index: number): string {
  let n = index + 1;
  let ref = "";
  while (n > 0) {
    const rem = (n - 1) % 26;
    ref = String.fromCharCode(65 + rem) + ref;
    n = Math.floor((n - 1) / 26);
  }
  return ref;
}

const LIKERT_VALUES = LIKERT_SCALE.map((o) => `${o.value} = ${o.label}`).join("; ");

function optionValues(options?: readonly Option[]): string {
  if (!options?.length) return "";
  return options.map((o) => `${o.value} = ${o.label}`).join("; ");
}

/**
 * Data dictionary for the Responses sheet: one row per column, giving the
 * variable name, where it came from in the questionnaire, the full question
 * wording, and its value labels. Without this the item codes (sq_tan1,
 * ce_cog2, ...) mean nothing to anyone opening the file in SPSS.
 */
function buildCodebookSheet(): Sheet {
  const rows: (Cell | string | number)[][] = [
    [
      bold("Column"),
      bold("Variable"),
      bold("Section"),
      bold("Construct"),
      bold("Dimension"),
      bold("Question or statement"),
      bold("Measurement"),
      bold("Values"),
    ],
  ];

  let col = 0;
  const add = (
    variable: string,
    section: string,
    construct: string,
    dimension: string,
    label: string,
    measurement: string,
    values: string
  ) => {
    rows.push([
      columnRef(col++),
      variable,
      section,
      construct,
      dimension,
      label,
      measurement,
      values,
    ]);
  };

  add(
    "submitted_at",
    "Record",
    "",
    "",
    "Date and time the response was submitted (ISO 8601, UTC)",
    "Date",
    ""
  );

  for (const q of SCREENING_QUESTIONS) {
    add(q.id, "Screening", "", "", q.text, "Nominal", optionValues(q.options));
  }

  for (const field of Object.values(PROFILE_FIELDS)) {
    const measurement =
      field.kind === "choice" ? "Nominal" : field.kind === "number" ? "Scale" : "Text";
    add(
      field.id,
      "Part I. Respondent Profile",
      "",
      "",
      field.text,
      measurement,
      field.kind === "choice" ? optionValues(field.options) : ""
    );
  }

  add("region", "Part I. Respondent Profile", "", "", "Administrative region of the fitness firm", "Nominal", "");
  add("province", "Part I. Respondent Profile", "", "", "Province or highly urbanized city", "Nominal", "");
  add("city_municipality", "Part I. Respondent Profile", "", "", "City or municipality", "Nominal", "");

  // Part numbering follows the printed instrument: Part II onwards.
  const partNumerals = ["II", "III", "IV", "V", "VI", "VII"];
  const partIndex = new Map<string, string>();
  for (const section of CONSTRUCT_SECTIONS) {
    if (!partIndex.has(section.part)) {
      partIndex.set(section.part, partNumerals[partIndex.size] ?? String(partIndex.size + 2));
    }
  }

  for (const section of CONSTRUCT_SECTIONS) {
    const dimension = section.title.includes("—")
      ? section.title.split("—").slice(1).join("—").trim()
      : section.title;
    for (const item of section.items) {
      add(
        item.id,
        `Part ${partIndex.get(section.part)}. ${section.part}`,
        section.part,
        dimension,
        item.text,
        "Scale (5-point Likert)",
        LIKERT_VALUES
      );
    }
  }

  for (const construct of CONSTRUCTS) {
    add(
      `SCORE_${construct.replace(/\s+/g, "_").toLowerCase()}`,
      "Computed",
      construct,
      "",
      `Mean of all ${construct} items for this respondent`,
      "Scale (1.00-5.00)",
      "Blank when any item in the scale is unanswered"
    );
  }

  return {
    name: "Codebook",
    columnWidths: [9, 26, 28, 22, 22, 80, 22, 46],
    rows,
  };
}

export function buildResultsWorkbook(rows: RawRow[], filters: Filters): Buffer {
  const scored = scoreResponses(rows);
  const sheets: Sheet[] = [];

  // ---------------------------------------------------------- raw responses
  const demographicIds = Object.values(PROFILE_FIELDS).map((f) => f.id);
  const itemIds = CONSTRUCT_SECTIONS.flatMap((s) => s.items.map((i) => i.id));

  sheets.push({
    name: "Responses",
    columnWidths: [22, ...demographicIds.map(() => 16), 26, 22, 22, ...itemIds.map(() => 9)],
    rows: [
      [
        bold("submitted_at"),
        ...SCREENING_QUESTIONS.map((q) => bold(q.id)),
        ...demographicIds.map((id) => bold(id)),
        bold("region"),
        bold("province"),
        bold("city_municipality"),
        ...itemIds.map((id) => bold(id)),
        ...CONSTRUCTS.map((c) => bold(`SCORE_${c.replace(/\s+/g, "_").toLowerCase()}`)),
      ],
      ...rows.map((row, i) => {
        const location = (row.demographics?.location ?? {}) as Record<string, string>;
        return [
          new Date(row.created_at).toISOString(),
          ...SCREENING_QUESTIONS.map((q) => row.screening?.[q.id] ?? ""),
          ...demographicIds.map((id) => {
            const v = row.demographics?.[id];
            return typeof v === "number" || typeof v === "string" ? v : "";
          }),
          location.regionName ?? row.region_name ?? "",
          location.provinceName ?? "",
          location.cityName ?? "",
          ...itemIds.map((id) => row.answers?.[id] ?? ""),
          ...CONSTRUCTS.map((c) => round(scored[i].construct[c], 4)),
        ];
      }),
    ],
  });

  sheets.push(buildCodebookSheet());

  // ------------------------------------------------------------ descriptives
  const descriptives = buildDescriptives(scored);
  sheets.push({
    name: "Descriptives",
    columnWidths: [34, 10, 10, 10, 16],
    rows: [
      [bold("Variable"), bold("n"), bold("Mean"), bold("SD"), bold("Interpretation")],
      ...descriptives.map((d) => [
        d.parent ? `    ${d.label}` : d.label,
        d.n,
        round(d.mean, 2),
        round(d.sd, 2),
        interpretMean(d.mean),
      ]),
    ],
  });

  // ------------------------------------------------------------- reliability
  sheets.push({
    name: "Reliability",
    columnWidths: [30, 10, 10, 14, 16],
    rows: [
      [bold("Scale"), bold("Items"), bold("n"), bold("Cronbach alpha"), bold("Interpretation")],
      ...buildReliability(rows).map((r) => [
        r.label,
        r.items,
        r.n,
        round(r.alpha, 3),
        interpretAlpha(r.alpha),
      ]),
    ],
  });

  // ------------------------------------------------------------ correlations
  const matrix = buildCorrelationMatrix(scored);
  const corrRows: (Cell | string | number)[][] = [
    [bold("Variable"), ...matrix.labels.map((_, i) => bold(String(i + 1)))],
  ];
  matrix.labels.forEach((label, i) => {
    corrRows.push([
      `${i + 1}. ${label}`,
      ...matrix.labels.map((__, j) => {
        if (i === j) return 1;
        const cell = matrix.cells[i][j];
        return cell ? round(cell.r, 3) : "";
      }),
    ]);
  });
  corrRows.push([]);
  corrRows.push([bold("Two-tailed p values")]);
  matrix.labels.forEach((label, i) => {
    corrRows.push([
      `${i + 1}. ${label}`,
      ...matrix.labels.map((__, j) => {
        if (i === j) return "";
        const cell = matrix.cells[i][j];
        return cell ? pValue(cell.p) : "";
      }),
    ]);
  });
  corrRows.push([]);
  corrRows.push([bold("n per pair")]);
  matrix.labels.forEach((label, i) => {
    corrRows.push([
      `${i + 1}. ${label}`,
      ...matrix.labels.map((__, j) => {
        if (i === j) return "";
        const cell = matrix.cells[i][j];
        return cell ? cell.n : "";
      }),
    ]);
  });
  sheets.push({ name: "Correlations", columnWidths: [30, 12, 12, 12, 12], rows: corrRows });

  // -------------------------------------------------------------- regression
  const regression = buildRegression(scored);
  const regRows: (Cell | string | number)[][] = [
    [bold(`Multiple regression predicting ${OUTCOME}`)],
    [],
  ];
  if (regression) {
    regRows.push(
      [bold("Predictor"), bold("B"), bold("SE"), bold("Beta"), bold("t"), bold("p")],
      ...[regression.intercept, ...regression.coefficients].map((c) => [
        c.name,
        round(c.b),
        round(c.se),
        Number.isFinite(c.beta) ? round(c.beta) : "",
        round(c.t),
        pValue(c.p),
      ]),
      [],
      [bold("Model"), bold("Value")],
      ["N", regression.n],
      ["R", round(regression.r)],
      ["R squared", round(regression.rSquared)],
      ["Adjusted R squared", round(regression.adjustedRSquared)],
      ["Std. error of the estimate", round(regression.standardError)],
      ["F", round(regression.f)],
      ["df1", regression.df1],
      ["df2", regression.df2],
      ["p", pValue(regression.pValue)]
    );
  } else {
    regRows.push(["Not enough complete cases to estimate the model."]);
  }
  sheets.push({ name: "Regression", columnWidths: [30, 12, 12, 12, 12, 12], rows: regRows });

  // --------------------------------------------------------------- mediation
  const mediations = buildMediations(scored);
  const medRows: (Cell | string | number)[][] = [
    [bold("Mediation: indirect effects through Trust")],
    [
      {
        value:
          "Ordinary least squares path analysis with a seeded percentile bootstrap. Not PLS-SEM.",
        italic: true,
      },
    ],
    [],
  ];
  if (mediations.length) {
    medRows.push(
      [
        bold("Path"),
        bold("a"),
        bold("b"),
        bold("c (total)"),
        bold("c' (direct)"),
        bold("ab (indirect)"),
        bold("CI lower"),
        bold("CI upper"),
        bold("Resamples"),
        bold("Mediation"),
      ],
      ...mediations.map((m) => [
        `${m.predictor} -> ${m.mediator} -> ${m.outcome}`,
        round(m.result.a.b),
        round(m.result.b.b),
        round(m.result.totalEffect.b),
        round(m.result.directEffect.b),
        round(m.result.indirectEffect),
        round(m.result.bootLower),
        round(m.result.bootUpper),
        m.result.bootSamples,
        m.result.significant ? "Supported" : "Not supported",
      ])
    );
  } else {
    medRows.push(["Not enough complete cases to estimate the indirect effects."]);
  }
  sheets.push({
    name: "Mediation",
    columnWidths: [40, 10, 10, 12, 12, 14, 12, 12, 12, 16],
    rows: medRows,
  });

  // ------------------------------------------------------------- frequencies
  const freqRows: (Cell | string | number)[][] = [
    [bold("Characteristic"), bold("Category"), bold("Frequency"), bold("Percent")],
  ];
  for (const table of buildFrequencyTables(rows)) {
    freqRows.push([bold(table.title), "", bold(table.total), ""]);
    for (const row of table.rows) {
      freqRows.push([
        "",
        row.label,
        row.count,
        table.total ? Number(((row.count / table.total) * 100).toFixed(1)) : "",
      ]);
    }
  }
  sheets.push({ name: "Profile", columnWidths: [40, 34, 12, 12], rows: freqRows });

  // -------------------------------------------------------------------- meta
  sheets.push({
    name: "About",
    columnWidths: [26, 80],
    rows: [
      [bold("Field"), bold("Value")],
      ["Study", "Influence of Service Quality and Customer Engagement on Customer Loyalty"],
      ["Exported", new Date().toISOString()],
      ["Filter applied", describeFilters(filters)],
      ["Responses in this export", rows.length],
      [
        "Estimator",
        "Descriptives, Cronbach's alpha, Pearson r, OLS multiple regression, and OLS mediation with a seeded percentile bootstrap.",
      ],
      [
        "Important",
        "The methodology chapter specifies PLS-SEM (SmartPLS). These figures use ordinary least squares and will not reproduce PLS-SEM output. Use the Responses sheet for the confirmatory analysis.",
      ],
    ],
  });

  return buildWorkbook(sheets);
}
