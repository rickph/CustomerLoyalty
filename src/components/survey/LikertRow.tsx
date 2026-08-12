import { LIKERT_SCALE } from "@/lib/survey/questionnaire";

type LikertRowProps = {
  id: string;
  text: string;
  value: number | undefined;
  onChange: (value: number) => void;
  error?: string;
};

/**
 * One statement plus a 1–5 agreement scale sized for thumbs.
 *
 * Every option keeps its word label at all widths: on a phone the digits alone
 * are meaningless, and endpoint-only anchors force the respondent to infer the
 * middle three. An answered statement also carries a left rule so what's still
 * blank can be scanned rather than hunted for after a validation error.
 */
export function LikertRow({ id, text, value, onChange, error }: LikertRowProps) {
  const answered = typeof value === "number";

  return (
    <div
      className={`border-b border-border py-5 last:border-b-0 ${
        answered ? "-ml-3 border-l-2 border-l-brand pl-[10px]" : ""
      }`}
    >
      <p className="mb-3 text-base font-medium">{text}</p>
      <div role="radiogroup" aria-label={text} className="flex items-stretch gap-1.5 sm:gap-2">
        {LIKERT_SCALE.map((opt) => {
          const selected = value === opt.value;
          return (
            <button
              key={opt.value}
              type="button"
              role="radio"
              aria-checked={selected}
              aria-label={`${opt.value}, ${opt.label}`}
              onClick={() => onChange(opt.value)}
              className={`flex min-h-16 flex-1 cursor-pointer flex-col items-center justify-center gap-1 rounded-lg border px-1 py-2 text-center transition-colors ${
                selected
                  ? "border-brand bg-brand font-semibold text-brand-foreground"
                  : "border-border bg-surface hover:border-brand/50"
              }`}
            >
              <span className="text-base leading-none">{opt.value}</span>
              <span
                className={`text-[9.5px] leading-[1.15] sm:text-[10px] ${
                  selected ? "opacity-90" : "text-foreground/55"
                }`}
              >
                {opt.label}
              </span>
            </button>
          );
        })}
      </div>
      {error && (
        <p className="mt-2 text-sm text-danger" role="alert" id={`${id}-error`}>
          {error}
        </p>
      )}
    </div>
  );
}
