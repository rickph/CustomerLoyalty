import { NextRequest, NextResponse } from "next/server";
import { ADMIN_COOKIE_NAME, isValidAdminSessionToken } from "@/lib/admin/auth";
import { getDb } from "@/lib/db/client";
import { applyFilters, parseFilters } from "@/lib/admin/filters";
import type { RawRow } from "@/lib/admin/results";
import { buildResultsWorkbook } from "@/lib/admin/workbook";

/**
 * Full Excel workbook: raw item-level responses plus every computed table.
 * Honours the same query-string filters as the dashboard, so the file always
 * matches what was on screen when the button was pressed.
 */
export async function GET(req: NextRequest) {
  if (!isValidAdminSessionToken(req.cookies.get(ADMIN_COOKIE_NAME)?.value)) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const filters = parseFilters(Object.fromEntries(req.nextUrl.searchParams));

  let rows: RawRow[];
  try {
    const sql = getDb();
    rows = await sql<RawRow[]>`
      select created_at, region_name, screening, demographics, answers
      from survey_responses
      where is_qualified = true
      order by created_at asc
    `;
  } catch (error) {
    console.error("Failed to fetch responses for the Excel export:", error);
    return NextResponse.json({ error: "Failed to fetch responses." }, { status: 500 });
  }

  const filtered = applyFilters(rows, filters);
  const workbook = buildResultsWorkbook(filtered, filters);
  const filename = `gym-loyalty-survey-results-${new Date().toISOString().slice(0, 10)}.xlsx`;

  return new NextResponse(new Uint8Array(workbook), {
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Content-Length": String(workbook.length),
      "Cache-Control": "no-store",
    },
  });
}
