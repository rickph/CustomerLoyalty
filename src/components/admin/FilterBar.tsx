"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";
import {
  gymTypeOptions,
  PERIOD_OPTIONS,
  visitFrequencyOptions,
  type Filters,
} from "@/lib/admin/filters";

type FilterBarProps = {
  filters: Filters;
  /** Region names present in the data, so the list only offers real options. */
  regions: string[];
  matched: number;
  total: number;
};

/**
 * One filter row above everything it scopes. State lives in the URL so the
 * view can be bookmarked and the export links can carry the same query.
 */
export function FilterBar({ filters, regions, matched, total }: FilterBarProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [pending, startTransition] = useTransition();

  function update(key: string, value: string) {
    const next = new URLSearchParams(searchParams.toString());
    if (value === "all") next.delete(key);
    else next.set(key, value);
    const qs = next.toString();
    startTransition(() => router.push(qs ? `/admin?${qs}` : "/admin", { scroll: false }));
  }

  const active =
    filters.period !== "all" ||
    filters.region !== "all" ||
    filters.gymType !== "all" ||
    filters.visitFrequency !== "all";

  return (
    <div
      className={`mb-8 rounded-xl border border-border bg-surface-sunk p-3 transition-opacity ${
        pending ? "opacity-60" : ""
      }`}
    >
      <div className="flex flex-wrap items-center gap-2">
        <Select
          label="Period"
          value={filters.period}
          onChange={(v) => update("period", v)}
          options={PERIOD_OPTIONS.map((o) => ({ value: o.value, label: o.label }))}
        />
        <Select
          label="Region"
          value={filters.region}
          onChange={(v) => update("region", v)}
          options={[
            { value: "all", label: "All regions" },
            ...regions.map((r) => ({ value: r, label: r })),
          ]}
        />
        <Select
          label="Gym type"
          value={filters.gymType}
          onChange={(v) => update("gym", v)}
          options={[
            { value: "all", label: "All types" },
            ...gymTypeOptions().map((o) => ({ value: o.value, label: o.label })),
          ]}
        />
        <Select
          label="Visit frequency"
          value={filters.visitFrequency}
          onChange={(v) => update("freq", v)}
          options={[
            { value: "all", label: "Any frequency" },
            ...visitFrequencyOptions().map((o) => ({ value: o.value, label: o.label })),
          ]}
        />

        <span className="ml-auto flex items-center gap-3 text-xs text-foreground/60">
          <span className="tabular-nums">
            {matched === total ? (
              <>All {total} responses</>
            ) : (
              <>
                {matched} of {total} responses
              </>
            )}
          </span>
          {active && (
            <button
              type="button"
              onClick={() => startTransition(() => router.push("/admin", { scroll: false }))}
              className="cursor-pointer underline underline-offset-2 hover:text-foreground"
            >
              Clear
            </button>
          )}
        </span>
      </div>
    </div>
  );
}

function Select({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <label className="flex items-center gap-1.5 text-xs">
      <span className="text-foreground/55">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="min-h-8 cursor-pointer rounded-lg border border-border bg-surface px-2 py-1 text-xs font-medium text-foreground"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  );
}
