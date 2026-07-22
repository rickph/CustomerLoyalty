import { cookies } from "next/headers";
import { ADMIN_COOKIE_NAME, isValidAdminSessionToken } from "@/lib/admin/auth";
import { getDb } from "@/lib/db/client";
import {
  computeConstructAverages,
  computeDemographicBreakdowns,
  computeGymTypeBreakdown,
  computeRegionBreakdown,
  type BarDatum,
} from "@/lib/admin/analytics";
import { AdminLoginForm } from "@/components/admin/AdminLoginForm";
import { LogoutButton } from "@/components/admin/LogoutButton";
import { BarList } from "@/components/admin/BarList";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get(ADMIN_COOKIE_NAME)?.value;
  const isAuthed = isValidAdminSessionToken(token);

  if (!isAuthed) {
    return (
      <div className="mx-auto flex min-h-dvh w-full max-w-sm flex-col justify-center px-4">
        <h1 className="text-lg font-semibold mb-4">Admin login</h1>
        <AdminLoginForm />
      </div>
    );
  }

  const stats = await loadStats();

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-8 sm:px-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-lg font-semibold">Survey responses</h1>
        <LogoutButton />
      </div>

      {stats.error ? (
        <p className="text-sm text-danger">{stats.error}</p>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-4 mb-8">
            <StatCard label="Qualified responses" value={stats.total} />
            <StatCard
              label="Latest submission"
              value={stats.latest ? new Date(stats.latest).toLocaleString("en-PH") : "—"}
              small
            />
          </div>

          <ChartCard title="Average score by construct" subtitle="1–5 scale, all responses">
            <BarList data={stats.constructAverages} max={5} valueFormat={(v) => v.toFixed(1)} />
          </ChartCard>

          <ChartCard title="Responses by region">
            <BarList data={stats.byRegion} />
          </ChartCard>

          <ChartCard title="Respondent demographics">
            <div className="grid gap-6 sm:grid-cols-2">
              {stats.demographics.map((d) => (
                <div key={d.title}>
                  <h3 className="text-xs font-medium text-foreground/50 mb-2.5">{d.title}</h3>
                  <BarList data={d.data} />
                </div>
              ))}
              {stats.gymType && (
                <div>
                  <h3 className="text-xs font-medium text-foreground/50 mb-2.5">Gym type</h3>
                  <BarList data={stats.gymType} />
                </div>
              )}
            </div>
          </ChartCard>

          <a
            href="/api/admin/export"
            className="inline-flex min-h-12 items-center justify-center rounded-xl bg-brand px-5 text-base font-semibold text-brand-foreground"
          >
            Download CSV (for SPSS / Excel)
          </a>
        </>
      )}
    </div>
  );
}

function StatCard({ label, value, small }: { label: string; value: string | number; small?: boolean }) {
  return (
    <div className="rounded-xl border border-border bg-surface px-4 py-3">
      <p className="text-xs text-foreground/50 mb-1">{label}</p>
      <p className={small ? "text-sm font-medium" : "text-2xl font-semibold"}>{value}</p>
    </div>
  );
}

function ChartCard({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mb-6 rounded-xl border border-border bg-surface p-4 sm:p-5">
      <div className="mb-4">
        <h2 className="text-sm font-semibold">{title}</h2>
        {subtitle && <p className="text-xs text-foreground/50 mt-0.5">{subtitle}</p>}
      </div>
      {children}
    </div>
  );
}

async function loadStats() {
  try {
    const sql = getDb();

    const [{ count }] = await sql<{ count: number }[]>`
      select count(*)::int as count from survey_responses
    `;

    const rows = await sql<
      {
        region_name: string | null;
        created_at: string;
        screening: Record<string, string>;
        demographics: Record<string, unknown>;
        answers: Record<string, number>;
      }[]
    >`
      select region_name, created_at, screening, demographics, answers
      from survey_responses order by created_at desc
    `;

    return {
      total: count ?? 0,
      latest: rows[0]?.created_at ?? null,
      byRegion: computeRegionBreakdown(rows),
      constructAverages: computeConstructAverages(rows),
      demographics: computeDemographicBreakdowns(rows),
      gymType: computeGymTypeBreakdown(rows),
      error: null as string | null,
    };
  } catch (err) {
    console.error("Failed to load admin stats:", err);
    return {
      total: 0,
      latest: null as string | null,
      byRegion: [] as BarDatum[],
      constructAverages: [] as BarDatum[],
      demographics: [] as { title: string; data: BarDatum[] }[],
      gymType: null as BarDatum[] | null,
      error: "Failed to load stats. Check that DATABASE_URL is configured (see .env.example).",
    };
  }
}
