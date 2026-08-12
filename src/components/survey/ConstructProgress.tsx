import { CONSTRUCT_SECTIONS } from "@/lib/survey/questionnaire";

/** The four constructs, in questionnaire order, with a short label for narrow screens. */
const CONSTRUCTS: string[] = Array.from(
  CONSTRUCT_SECTIONS.reduce<Set<string>>((set, s) => set.add(s.part), new Set())
);

const SHORT_LABEL: Record<string, string> = {
  "Service Quality": "Quality",
  "Customer Engagement": "Engagement",
  Trust: "Trust",
  "Customer Loyalty": "Loyalty",
};

/** Each construct gets the same colour it carries on the results dashboard. */
const CONSTRUCT_COLOR: Record<string, string> = {
  "Service Quality": "var(--series-quality)",
  "Customer Engagement": "var(--series-engagement)",
  Trust: "var(--series-trust)",
  "Customer Loyalty": "var(--series-loyalty)",
};

export type ConstructProgressData = {
  /** Overall position, used for the accessible value and the early steps. */
  current: number;
  total: number;
  /** Step name, e.g. "Tangibles" or "Eligibility". */
  label: string;
  /** Construct the current step belongs to; absent on the screening/profile steps. */
  part?: string;
  /** Position of the current dimension within its construct, 1-based. */
  positionInPart?: number;
  countInPart?: number;
};

/**
 * Two tiers: the four constructs across the top show the shape of the whole
 * survey, and the bar underneath tracks progress inside the current one. A
 * respondent on step 11 of 19 otherwise has no idea how much is left.
 */
export function ConstructProgress({
  current,
  total,
  label,
  part,
  positionInPart,
  countInPart,
}: ConstructProgressData) {
  const activeIndex = part ? CONSTRUCTS.indexOf(part) : -1;
  const percent = Math.round((current / total) * 100);

  const withinPart =
    positionInPart && countInPart
      ? Math.round((positionInPart / countInPart) * 100)
      : percent;

  return (
    <div
      className="w-full"
      role="progressbar"
      aria-valuenow={percent}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={`Survey progress: ${label}`}
    >
      <div className="flex gap-1.5">
        {CONSTRUCTS.map((name, i) => {
          const done = activeIndex > i;
          const active = activeIndex === i;
          return (
            <div key={name} className="flex flex-1 flex-col gap-1">
              <div className="h-[3px] w-full overflow-hidden rounded-full bg-border">
                <div
                  className="h-full rounded-full transition-[width] duration-300 ease-out"
                  style={{
                    width: done ? "100%" : active ? `${withinPart}%` : "0%",
                    background: CONSTRUCT_COLOR[name] ?? "var(--brand)",
                  }}
                />
              </div>
              <span
                className={`text-[9px] font-semibold uppercase tracking-wide leading-none ${
                  active ? "text-foreground" : "text-foreground/45"
                }`}
              >
                <span className="sm:hidden">{SHORT_LABEL[name] ?? name}</span>
                <span className="hidden sm:inline">{name}</span>
              </span>
            </div>
          );
        })}
      </div>

      <div className="mt-2 flex items-baseline justify-between gap-3 text-xs text-foreground/60">
        <span className="font-medium text-foreground/80">{label}</span>
        <span className="shrink-0 tabular-nums">
          {part && positionInPart && countInPart
            ? `${positionInPart} of ${countInPart} · ${SHORT_LABEL[part] ?? part}`
            : `Step ${current} of ${total}`}
        </span>
      </div>
    </div>
  );
}
