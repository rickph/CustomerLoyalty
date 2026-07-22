import { LIKERT_SCALE } from "@/lib/survey/questionnaire";

type LikertRowProps = {
  id: string;
  text: string;
  value: number | undefined;
  onChange: (value: number) => void;
  error?: string;
};

/** One statement + a horizontal 1-5 agreement scale with large tap targets, sized for thumbs. */
export function LikertRow({ id, text, value, onChange, error }: LikertRowProps) {
  return (
    <div className="py-5 border-b border-border last:border-b-0">
      <p className="text-base font-medium mb-3">{text}</p>
      <div role="radiogroup" aria-label={text} className="flex items-stretch gap-1.5 sm:gap-2">
        {LIKERT_SCALE.map((opt) => {
          const selected = value === opt.value;
          return (
            <button
              key={opt.value}
              type="button"
              role="radio"
              aria-checked={selected}
              aria-label={opt.label}
              onClick={() => onChange(opt.value)}
              className={`flex-1 min-h-14 rounded-lg border flex flex-col items-center justify-center gap-0.5 px-1 py-2 text-center transition-colors cursor-pointer ${
                selected
                  ? "border-brand bg-brand text-brand-foreground font-semibold"
                  : "border-border bg-surface hover:border-brand/50"
              }`}
            >
              <span className="text-base leading-none">{opt.value}</span>
              <span className="hidden sm:block text-[10px] leading-tight opacity-80">
                {opt.label}
              </span>
            </button>
          );
        })}
      </div>
      <div className="flex justify-between text-[11px] text-foreground/50 mt-1 sm:hidden">
        <span>{LIKERT_SCALE[0].label}</span>
        <span>{LIKERT_SCALE[LIKERT_SCALE.length - 1].label}</span>
      </div>
      {error && (
        <p className="mt-2 text-sm text-danger" role="alert" id={`${id}-error`}>
          {error}
        </p>
      )}
    </div>
  );
}
