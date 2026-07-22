import { CONSTRUCT_SECTIONS, DEMOGRAPHIC_FIELDS, SCREENING_QUESTIONS } from "@/lib/survey/questionnaire";

export type ResponseRow = {
  id: string;
  created_at: string;
  is_qualified: boolean;
  screening: Record<string, string>;
  demographics: Record<string, unknown> & {
    location?: { regionName?: string; provinceName?: string; cityName?: string };
  };
  answers: Record<string, number>;
};

const demographicFieldIds = Object.values(DEMOGRAPHIC_FIELDS).map((f) => f.id);

function csvEscape(value: unknown): string {
  const str = value === null || value === undefined ? "" : String(value);
  if (/[",\n]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

/** Builds a CSV, columns kept in sync with the current questionnaire so it stays analysis-ready for SPSS/Excel. */
export function responsesToCsv(rows: ResponseRow[]): string {
  const header = [
    "id",
    "submitted_at",
    ...SCREENING_QUESTIONS.map((q) => q.id),
    ...demographicFieldIds,
    "region",
    "province",
    "city_municipality",
    ...CONSTRUCT_SECTIONS.flatMap((s) => s.items.map((i) => i.id)),
  ];

  const lines = [header.map(csvEscape).join(",")];

  for (const row of rows) {
    const cells = [
      row.id,
      new Date(row.created_at).toISOString(),
      ...SCREENING_QUESTIONS.map((q) => row.screening?.[q.id] ?? ""),
      ...demographicFieldIds.map((id) => row.demographics?.[id] ?? ""),
      row.demographics?.location?.regionName ?? "",
      row.demographics?.location?.provinceName ?? "",
      row.demographics?.location?.cityName ?? "",
      ...CONSTRUCT_SECTIONS.flatMap((s) => s.items.map((i) => row.answers?.[i.id] ?? "")),
    ];
    lines.push(cells.map(csvEscape).join(","));
  }

  return lines.join("\n");
}
