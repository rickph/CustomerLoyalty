import type { Option } from "@/lib/survey/types";

type ChoiceButtonsProps = {
  name: string;
  options: Option[];
  value: string | undefined;
  onChange: (value: string) => void;
  error?: string;
  columns?: 1 | 2;
};

/** Large tap-target single-choice picker, used for screening/demographic questions with a handful of options. */
export function ChoiceButtons({ name, options, value, onChange, error, columns = 1 }: ChoiceButtonsProps) {
  return (
    <div>
      <div
        role="radiogroup"
        aria-label={name}
        className={columns === 2 ? "grid grid-cols-2 gap-3" : "flex flex-col gap-3"}
      >
        {options.map((opt) => {
          const selected = value === opt.value;
          return (
            <button
              key={opt.value}
              type="button"
              role="radio"
              aria-checked={selected}
              onClick={() => onChange(opt.value)}
              className={`min-h-14 rounded-xl border px-4 py-3 text-left text-base leading-snug transition-colors cursor-pointer ${
                selected
                  ? "border-brand bg-brand-soft font-medium"
                  : "border-border bg-surface hover:border-brand/50"
              }`}
            >
              <span className="flex items-center gap-3">
                <span
                  className={`inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 ${
                    selected ? "border-brand" : "border-border"
                  }`}
                >
                  {selected && <span className="h-2.5 w-2.5 rounded-full bg-brand" />}
                </span>
                {opt.label}
              </span>
            </button>
          );
        })}
      </div>
      {error && (
        <p className="mt-2 text-sm text-danger" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
