import { ProgressBar } from "./ProgressBar";

type WizardShellProps = {
  children: React.ReactNode;
  progress?: { current: number; total: number; label: string };
  footer?: React.ReactNode;
  headerAction?: React.ReactNode;
};

export function WizardShell({ children, progress, footer, headerAction }: WizardShellProps) {
  return (
    <div className="flex min-h-dvh flex-col">
      <header className="border-b border-border bg-surface px-4 py-3 sm:px-6">
        <div className="mx-auto flex max-w-xl items-center justify-between">
          <span className="text-sm font-semibold tracking-tight">Gym Loyalty Survey</span>
          {headerAction}
        </div>
        {progress && (
          <div className="mx-auto mt-2 max-w-xl">
            <ProgressBar currentStep={progress.current} totalSteps={progress.total} label={progress.label} />
          </div>
        )}
      </header>

      <main className="mx-auto w-full max-w-xl flex-1 px-4 py-6 sm:px-6 sm:py-8">{children}</main>

      {footer && (
        <footer className="sticky bottom-0 border-t border-border bg-surface px-4 py-3 sm:px-6">
          <div className="mx-auto max-w-xl">{footer}</div>
        </footer>
      )}
    </div>
  );
}
