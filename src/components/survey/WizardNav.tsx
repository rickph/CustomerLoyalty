type WizardNavProps = {
  onBack?: () => void;
  onNext: () => void;
  nextLabel?: string;
  nextDisabled?: boolean;
  nextLoading?: boolean;
};

export function WizardNav({ onBack, onNext, nextLabel = "Next", nextDisabled, nextLoading }: WizardNavProps) {
  return (
    <div className="flex items-center gap-3">
      {onBack && (
        <button
          type="button"
          onClick={onBack}
          className="min-h-12 rounded-xl border border-border bg-surface px-5 text-base font-medium cursor-pointer hover:border-brand/50"
        >
          Back
        </button>
      )}
      <button
        type="button"
        onClick={onNext}
        disabled={nextDisabled || nextLoading}
        className="min-h-12 flex-1 rounded-xl bg-brand px-5 text-base font-semibold text-brand-foreground cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {nextLoading ? "Please wait…" : nextLabel}
      </button>
    </div>
  );
}
