import { NextRequest, NextResponse } from "next/server";
import { surveyResponseSchema } from "@/lib/survey/schema";
import { SCREENING_QUESTIONS } from "@/lib/survey/questionnaire";
import { getDb } from "@/lib/db/client";

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const parsed = surveyResponseSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed.", issues: parsed.error.issues },
      { status: 400 }
    );
  }

  const { screening, demographics, answers } = parsed.data;

  // A disqualified respondent should never reach this endpoint (the wizard
  // stops them earlier), but re-check server-side defensively.
  const isQualified = SCREENING_QUESTIONS.every((q) => {
    const value = String(screening[q.id as keyof typeof screening] ?? "");
    return !q.disqualifyOn?.includes(value);
  });

  if (!isQualified) {
    return NextResponse.json(
      { error: "Respondent does not meet the screening criteria." },
      { status: 422 }
    );
  }

  const sql = getDb();
  try {
    // Round-trip through JSON: the zod schema's dynamic keys (driven by
    // questionnaire.ts) type these as Record<string, unknown> rather than a
    // literal shape, which postgres.js's JSONValue type won't accept
    // directly even though the values are already plain JSON at runtime.
    const asJson = (value: unknown) => sql.json(JSON.parse(JSON.stringify(value)));

    await sql`
      insert into survey_responses (
        is_qualified, screening, demographics, answers,
        region_code, region_name, province_name, city_name
      ) values (
        true, ${asJson(screening)}, ${asJson(demographics)}, ${asJson(answers)},
        ${demographics.location.regionCode}, ${demographics.location.regionName},
        ${demographics.location.provinceName}, ${demographics.location.cityName}
      )
    `;
  } catch (error) {
    console.error("Failed to insert survey response:", error);
    return NextResponse.json({ error: "Failed to save response." }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
