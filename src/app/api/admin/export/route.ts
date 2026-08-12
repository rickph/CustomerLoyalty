import { NextRequest, NextResponse } from "next/server";
import { ADMIN_COOKIE_NAME, isValidAdminSessionToken } from "@/lib/admin/auth";
import { getDb } from "@/lib/db/client";
import { responsesToCsv, type ResponseRow } from "@/lib/admin/csv";
import { applyFilters, parseFilters } from "@/lib/admin/filters";

export async function GET(req: NextRequest) {
  const token = req.cookies.get(ADMIN_COOKIE_NAME)?.value;
  if (!isValidAdminSessionToken(token)) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const sql = getDb();
  let rows: ResponseRow[];
  try {
    rows = await sql<ResponseRow[]>`select * from survey_responses order by created_at asc`;
  } catch (error) {
    console.error("Failed to fetch responses for export:", error);
    return NextResponse.json({ error: "Failed to fetch responses." }, { status: 500 });
  }

  // Same query string as the dashboard, so the file matches what was on screen.
  const csv = responsesToCsv(applyFilters(rows, parseFilters(Object.fromEntries(req.nextUrl.searchParams))));
  const filename = `gym-loyalty-survey-responses-${new Date().toISOString().slice(0, 10)}.csv`;

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
