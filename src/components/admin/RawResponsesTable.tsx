import {
  CONSTRUCT_SECTIONS,
  PROFILE_FIELDS,
  SCREENING_QUESTIONS,
} from "@/lib/survey/questionnaire";
import type { RawRow } from "@/lib/admin/results";

/** Newest first on screen; the export stays in submission order. */
const PREVIEW_LIMIT = 100;

type Column = {
  id: string;
  /** Full question wording, shown on hover so the codes stay decipherable. */
  label: string;
  numeric?: boolean;
};

/**
 * Column order is identical to the Responses sheet of the Excel export, so what
 * the researcher checks on screen is literally the file the statistician gets.
 */
function buildColumns(): Column[] {
  const cols: Column[] = [{ id: "submitted_at", label: "Date and time of submission" }];

  for (const q of SCREENING_QUESTIONS) cols.push({ id: q.id, label: q.text });

  for (const f of Object.values(PROFILE_FIELDS)) {
    cols.push({ id: f.id, label: f.text, numeric: f.kind === "number" });
  }

  cols.push(
    { id: "region", label: "Administrative region of the fitness firm" },
    { id: "province", label: "Province or highly urbanized city" },
    { id: "city_municipality", label: "City or municipality" }
  );

  for (const section of CONSTRUCT_SECTIONS) {
    for (const item of section.items) {
      cols.push({ id: item.id, label: `${section.title}: ${item.text}`, numeric: true });
    }
  }

  return cols;
}

function cellValue(row: RawRow, col: Column): string {
  if (col.id === "submitted_at") {
    return new Date(row.created_at).toLocaleString("en-PH", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }
  const location = (row.demographics?.location ?? {}) as Record<string, string>;
  if (col.id === "region") return location.regionName ?? row.region_name ?? "";
  if (col.id === "province") return location.provinceName ?? "";
  if (col.id === "city_municipality") return location.cityName ?? "";

  const screening = row.screening?.[col.id];
  if (screening !== undefined) return String(screening);

  const demographic = row.demographics?.[col.id];
  if (demographic !== undefined && typeof demographic !== "object") return String(demographic);

  const answer = row.answers?.[col.id];
  return answer === undefined || answer === null ? "" : String(answer);
}

export function RawResponsesTable({ rows }: { rows: RawRow[] }) {
  const columns = buildColumns();
  const shown = rows.slice(0, PREVIEW_LIMIT);
  const itemCount = CONSTRUCT_SECTIONS.reduce((n, s) => n + s.items.length, 0);

  return (
    <section>
      <h2 className="mb-1 text-base font-semibold">Response data</h2>
      <p className="mb-4 text-sm text-foreground/60">
        One row per response, one column per question, in the same order as the export. Hover a
        column heading to see the full question. {columns.length} columns: submission time,{" "}
        {SCREENING_QUESTIONS.length} screening items, {Object.keys(PROFILE_FIELDS).length} profile
        fields, region, province, city, and {itemCount} scale items.
      </p>

      <div className="overflow-x-auto rounded-xl border border-border bg-surface">
        <table className="min-w-max border-collapse text-xs">
          <thead>
            <tr className="border-b border-border">
              {columns.map((col, i) => (
                <th
                  key={col.id}
                  title={col.label}
                  scope="col"
                  className={`whitespace-nowrap px-2.5 py-2 text-left font-semibold ${
                    i === 0
                      ? "sticky left-0 z-10 border-r border-border bg-surface-sunk"
                      : "bg-surface-sunk"
                  }`}
                >
                  {col.id}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {shown.map((row, r) => (
              <tr key={`${row.created_at}-${r}`} className="border-b border-border last:border-b-0">
                {columns.map((col, i) => (
                  <td
                    key={col.id}
                    className={`whitespace-nowrap px-2.5 py-1.5 ${
                      col.numeric ? "text-right tabular-nums" : ""
                    } ${
                      i === 0
                        ? "sticky left-0 z-10 border-r border-border bg-surface text-foreground/70"
                        : "text-foreground/80"
                    }`}
                  >
                    {cellValue(row, col)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="mt-2.5 text-xs text-foreground/50">
        {rows.length > PREVIEW_LIMIT
          ? `Showing the ${PREVIEW_LIMIT} most recent of ${rows.length} responses. The export contains all of them.`
          : `Showing all ${rows.length} response${rows.length === 1 ? "" : "s"}.`}{" "}
        Values are exactly as recorded. The Excel workbook adds a codebook mapping every column to
        its question, construct, dimension and value labels.
      </p>
    </section>
  );
}
