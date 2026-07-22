import { cookies } from "next/headers";
import { ADMIN_COOKIE_NAME, isValidAdminSessionToken } from "@/lib/admin/auth";
import { getDb } from "@/lib/db/client";
import { AdminLoginForm } from "@/components/admin/AdminLoginForm";
import { LogoutButton } from "@/components/admin/LogoutButton";

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
    <div className="mx-auto w-full max-w-2xl px-4 py-8 sm:px-6">
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

          <div className="mb-8">
            <h2 className="text-sm font-semibold mb-3 text-foreground/70">Responses by region</h2>
            <div className="rounded-xl border border-border bg-surface divide-y divide-border">
              {stats.byRegion.length === 0 && (
                <p className="px-4 py-3 text-sm text-foreground/50">No responses yet.</p>
              )}
              {stats.byRegion.map(({ region, count }) => (
                <div key={region} className="flex items-center justify-between px-4 py-2.5 text-sm">
                  <span>{region}</span>
                  <span className="font-medium">{count}</span>
                </div>
              ))}
            </div>
          </div>

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

async function loadStats() {
  try {
    const sql = getDb();

    const [{ count }] = await sql<{ count: number }[]>`
      select count(*)::int as count from survey_responses
    `;

    const rows = await sql<{ region_name: string | null; created_at: string }[]>`
      select region_name, created_at from survey_responses order by created_at desc
    `;

    const byRegionMap = new Map<string, number>();
    for (const row of rows) {
      const region = row.region_name || "Unknown";
      byRegionMap.set(region, (byRegionMap.get(region) ?? 0) + 1);
    }
    const byRegion = Array.from(byRegionMap.entries())
      .map(([region, count]) => ({ region, count }))
      .sort((a, b) => b.count - a.count);

    return {
      total: count ?? 0,
      latest: rows[0]?.created_at ?? null,
      byRegion,
      error: null as string | null,
    };
  } catch (err) {
    console.error("Failed to load admin stats:", err);
    return {
      total: 0,
      latest: null as string | null,
      byRegion: [] as { region: string; count: number }[],
      error: "Failed to load stats. Check that DATABASE_URL is configured (see .env.example).",
    };
  }
}
