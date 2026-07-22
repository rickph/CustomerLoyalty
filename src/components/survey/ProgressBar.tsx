type ProgressBarProps = {
  currentStep: number;
  totalSteps: number;
  label: string;
};

export function ProgressBar({ currentStep, totalSteps, label }: ProgressBarProps) {
  const percent = Math.round((currentStep / totalSteps) * 100);

  return (
    <div className="w-full">
      <div className="flex items-center justify-between text-xs text-foreground/60 mb-1.5">
        <span>{label}</span>
        <span>
          {currentStep} / {totalSteps}
        </span>
      </div>
      <div
        className="h-2 w-full rounded-full bg-border overflow-hidden"
        role="progressbar"
        aria-valuenow={percent}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label="Survey progress"
      >
        <div
          className="h-full rounded-full bg-brand transition-[width] duration-300 ease-out"
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
}
