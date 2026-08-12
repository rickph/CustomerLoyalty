import type { Metadata } from "next";
import { cookies } from "next/headers";
import { ADMIN_COOKIE_NAME, isValidAdminSessionToken } from "@/lib/admin/auth";
import { getDb } from "@/lib/db/client";
import { apaNumber, interpretMean } from "@/lib/admin/apa";
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
} from "@/lib/admin/results";
import {
  applyFilters,
  describeFilters,
  filtersToQuery,
  parseFilters,
  type Filters,
} from "@/lib/admin/filters";
import { AdminLoginForm } from "@/components/admin/AdminLoginForm";
import { LogoutButton } from "@/components/admin/LogoutButton";
import { FilterBar } from "@/components/admin/FilterBar";
import { ExportBar } from "@/components/admin/ExportBar";
import { ThemeToggle } from "@/components/ThemeToggle";
import {
  CorrelationTable,
  DescriptivesTable,
  FrequencyTables,
  MediationTable,
  RegressionTable,
  ReliabilityTable,
} from "@/components/admin/ResultsTables";

export const dynamic = "force-dynamic";

/** Unlisted: the dashboard is reachable only by URL and is password-gated. */
export const metadata: Metadata = {
  title: "Survey Results",
  robots: { index: false, follow: false, nocache: true },
};

const CONSTRUCT_COLOR: Record<string, string> = {
  "Service Quality": "var(--series-quality)",
  "Customer Engagement": "var(--series-engagement)",
  Trust: "var(--series-trust)",
  "Customer Loyalty": "var(--series-loyalty)",
};

export default async function AdminPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const cookieStore = await cookies();
  const isAuthed = isValidAdminSessionToken(cookieStore.get(ADMIN_COOKIE_NAME)?.value);

  if (!isAuthed) {
    return (
      <div className="mx-auto flex min-h-dvh w-full max-w-sm flex-col justify-center px-4">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-lg font-semibold">Researcher access</h1>
          <ThemeToggle />
        </div>
        <AdminLoginForm />
        <p className="mt-6 text-xs text-foreground/50">
          This page is for the researcher only. Survey respondents do not need to sign in.
        </p>
      </div>
    );
  }

  const filters = parseFilters(await searchParams);
  const data = await loadResults(filters);
  const query = filtersToQuery(filters);

  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-8 sm:px-6">
      <header className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Survey results</h1>
          <p className="mt-0.5 text-sm text-foreground/60">
            Influence of Service Quality and Customer Engagement on Customer Loyalty
          </p>
          <p className="mt-1.5 hidden text-xs text-foreground/60 print:block">
            {describeFilters(filters)} · {data.total} responses · exported{" "}
            {new Date().toLocaleDateString("en-PH", {
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
          </p>
        </div>
        <div className="flex items-center gap-3 print:hidden">
          <ThemeToggle />
          <LogoutButton />
        </div>
      </header>

      {data.error ? (
        <p className="text-sm text-danger">{data.error}</p>
      ) : data.grandTotal === 0 ? (
        <EmptyState />
      ) : (
        <>
          <div className="print:hidden">
            <FilterBar
              filters={filters}
              regions={data.regions}
              matched={data.total}
              total={data.grandTotal}
            />
          </div>

          {data.total === 0 ? (
            <NoMatches />
          ) : (
            <>
          <section className="mb-10 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <StatCard label="Responses" value={data.total} />
            <StatCard
              label="Complete cases"
              value={data.completeCases}
              hint={`of ${data.total} for the full model`}
            />
            <StatCard
              label="Regions represented"
              value={data.regionsRepresented}
              hint="of 18"
            />
            <StatCard
              label="Latest submission"
              value={
                data.latest
                  ? new Date(data.latest).toLocaleDateString("en-PH", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })
                  : "—"
              }
              small
            />
          </section>

          <section className="mb-10">
            <h2 className="mb-1 text-base font-semibold">Construct averages</h2>
            <p className="mb-4 text-sm text-foreground/60">
              Mean of every item in the construct, on the five-point scale.
            </p>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              {CONSTRUCTS.map((name) => {
                const row = data.descriptives.find((d) => d.label === name && !d.parent);
                const value = row?.mean ?? NaN;
                return (
                  <div
                    key={name}
                    className="rounded-xl border border-border bg-surface px-4 py-3"
                  >
                    <p className="mb-1.5 text-xs text-foreground/60">{name}</p>
                    <p className="text-2xl font-semibold leading-none">
                      {apaNumber(value)}
                      <span className="text-sm font-normal text-foreground/50"> / 5</span>
                    </p>
                    <div className="mt-2.5 h-1.5 overflow-hidden rounded-full bg-surface-sunk">
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${Number.isFinite(value) ? (value / 5) * 100 : 0}%`,
                          background: CONSTRUCT_COLOR[name] ?? "var(--series-quality)",
                        }}
                      />
                    </div>
                    <p className="mt-1.5 text-xs text-foreground/50">{interpretMean(value)}</p>
                  </div>
                );
              })}
            </div>
          </section>

          <section>
            <h2 className="mb-1 text-base font-semibold">Statistical results</h2>
            <p className="mb-2 text-sm text-foreground/60">
              Formatted to APA 7 so the tables can be lifted into Chapter 4.
            </p>
            <p className="mb-6 rounded-lg border border-border bg-surface-sunk px-3.5 py-2.5 text-xs leading-relaxed text-foreground/70">
              These are computed live by the app using ordinary least squares. Your methodology
              chapter specifies PLS-SEM in SmartPLS, which is a different estimator and will not
              reproduce these coefficients — run the confirmatory analysis on the exported CSV and
              report that. Use this page to watch data quality while collection is running.
            </p>

            <FrequencyTables tables={data.frequencies} startNumber={1} />
            <ReliabilityTable rows={data.reliability} number={2} />
            <DescriptivesTable rows={data.descriptives} number={3} />
            <CorrelationTable matrix={data.correlations} number={4} />
            {data.regression ? (
              <RegressionTable result={data.regression} outcome={OUTCOME} number={5} />
            ) : (
              <NotEnoughData label="Regression" />
            )}
            {data.mediations.length > 0 ? (
              <MediationTable mediations={data.mediations} number={6} />
            ) : (
              <NotEnoughData label="Mediation" />
            )}
          </section>

          <ExportBar query={query} />
            </>
          )}
        </>
      )}
    </div>
  );
}

function StatCard({
  label,
  value,
  hint,
  small,
}: {
  label: string;
  value: string | number;
  hint?: string;
  small?: boolean;
}) {
  return (
    <div className="rounded-xl border border-border bg-surface px-4 py-3">
      <p className="mb-1 text-xs text-foreground/50">{label}</p>
      <p className={small ? "text-sm font-medium" : "text-2xl font-semibold"}>{value}</p>
      {hint && <p className="mt-1 text-xs text-foreground/50">{hint}</p>}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="rounded-xl border border-border bg-surface px-5 py-8 text-center">
      <p className="text-sm font-medium">No responses yet</p>
      <p className="mx-auto mt-1.5 max-w-sm text-sm text-foreground/60">
        Once respondents start submitting, this page will show the profile, reliability,
        descriptive, correlation, regression and mediation tables.
      </p>
    </div>
  );
}

function NotEnoughData({ label }: { label: string }) {
  return (
    <p className="my-8 rounded-lg border border-border bg-surface px-4 py-3 text-sm text-foreground/60">
      {label} needs more complete cases than are available yet.
    </p>
  );
}

async function loadResults(filters: Filters) {
  try {
    const sql = getDb();
    const allRows = await sql<RawRow[]>`
      select created_at, region_name, screening, demographics, answers
      from survey_responses
      where is_qualified = true
      order by created_at desc
    `;

    // Region choices come from the whole dataset, not the current slice, so
    // narrowing to one region doesn't erase the way back to the others.
    const regions = Array.from(
      new Set(allRows.map((r) => r.region_name).filter((r): r is string => Boolean(r)))
    ).sort();

    const rows = applyFilters(allRows, filters);
    const scored = scoreResponses(rows);
    const completeCases = scored.filter((r) =>
      CONSTRUCTS.every((c) => Number.isFinite(r.construct[c]))
    ).length;

    return {
      grandTotal: allRows.length,
      total: rows.length,
      completeCases,
      latest: rows[0]?.created_at ?? null,
      regions,
      regionsRepresented: new Set(rows.map((r) => r.region_name).filter(Boolean)).size,
      frequencies: buildFrequencyTables(rows),
      reliability: buildReliability(rows),
      descriptives: buildDescriptives(scored),
      correlations: buildCorrelationMatrix(scored),
      regression: buildRegression(scored),
      mediations: buildMediations(scored),
      error: null as string | null,
    };
  } catch (err) {
    console.error("Failed to load admin results:", err);
    return {
      grandTotal: 0,
      total: 0,
      completeCases: 0,
      latest: null as string | null,
      regions: [] as string[],
      regionsRepresented: 0,
      frequencies: [],
      reliability: [],
      descriptives: [],
      correlations: { labels: [], cells: [] },
      regression: null,
      mediations: [],
      error:
        "Failed to load results. Check that DATABASE_URL is configured (see .env.example).",
    };
  }
}

function NoMatches() {
  return (
    <div className="rounded-xl border border-border bg-surface px-5 py-8 text-center">
      <p className="text-sm font-medium">No responses match these filters</p>
      <p className="mx-auto mt-1.5 max-w-sm text-sm text-foreground/60">
        Widen the period or clear a filter to see results again.
      </p>
    </div>
  );
}
