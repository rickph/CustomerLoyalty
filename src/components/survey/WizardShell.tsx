import { ThemeToggle } from "@/components/ThemeToggle";
import { ConstructProgress, type ConstructProgressData } from "./ConstructProgress";

type WizardShellProps = {
  children: React.ReactNode;
  progress?: ConstructProgressData;
  footer?: React.ReactNode;
  headerAction?: React.ReactNode;
};

export function WizardShell({ children, progress, footer, headerAction }: WizardShellProps) {
  return (
    <div className="flex min-h-dvh flex-col">
      <header className="border-b border-border bg-surface px-4 py-3 sm:px-6">
        <div className="mx-auto flex max-w-xl items-center justify-between gap-3">
          <span className="text-sm font-semibold tracking-tight">Gym Loyalty Survey</span>
          <div className="flex items-center gap-3">
            {headerAction}
            <ThemeToggle />
          </div>
        </div>
        {progress && (
          <div className="mx-auto mt-3 max-w-xl">
            <ConstructProgress {...progress} />
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
