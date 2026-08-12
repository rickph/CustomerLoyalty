"use client";

type ExportBarProps = {
  /** Query string carrying the active filters, so exports match the screen. */
  query: string;
};

/**
 * Exports. The PDF route is the browser's own print-to-PDF driven by the print
 * stylesheet — it renders the charts and APA tables exactly as laid out, keeps
 * text selectable, and avoids shipping a headless browser just to draw a file.
 */
export function ExportBar({ query }: ExportBarProps) {
  return (
    <div className="mt-10 flex flex-wrap items-center gap-3 print:hidden">
      <a
        href={`/api/admin/export/xlsx${query}`}
        className="inline-flex min-h-11 items-center justify-center rounded-xl bg-brand px-5 text-sm font-semibold text-brand-foreground"
      >
        Download Excel workbook
      </a>
      <button
        type="button"
        onClick={() => window.print()}
        className="inline-flex min-h-11 cursor-pointer items-center justify-center rounded-xl border border-border bg-surface px-5 text-sm font-semibold hover:border-brand/50"
      >
        Save as PDF
      </button>
      <a
        href={`/api/admin/export${query}`}
        className="inline-flex min-h-11 items-center justify-center rounded-xl border border-border bg-surface px-5 text-sm font-medium hover:border-brand/50"
      >
        Raw CSV
      </a>
      <p className="w-full text-xs text-foreground/50">
        The Excel workbook holds the raw responses plus every table below, on separate sheets.
        &ldquo;Save as PDF&rdquo; opens your browser&apos;s print dialog. Choose{" "}
        <em>Save as PDF</em> as the destination, and keep background graphics on so the charts
        print.
      </p>
    </div>
  );
}
