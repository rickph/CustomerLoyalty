import type { ReactNode } from "react";

type ApaTableProps = {
  number: number;
  title: string;
  children: ReactNode;
  /** Rendered after an italic "Note." label, as APA requires. */
  note?: ReactNode;
};

/**
 * APA 7 table shell: the table number on its own line, an italicised title in
 * title case beneath it, horizontal rules only (no vertical lines), and an
 * optional note. Wide tables scroll inside their own container so the page
 * never scrolls sideways.
 */
export function ApaTable({ number, title, children, note }: ApaTableProps) {
  return (
    <figure className="my-8 first:mt-0">
      <figcaption className="mb-3">
        <span className="block text-sm font-semibold">Table {number}</span>
        <span className="block text-sm italic text-foreground/80">{title}</span>
      </figcaption>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[34rem] border-collapse text-sm">{children}</table>
      </div>
      {note && (
        <p className="mt-2.5 text-xs leading-relaxed text-foreground/60">
          <span className="italic">Note.</span> {note}
        </p>
      )}
    </figure>
  );
}

/** Header row group: rule above and below, per APA. */
export function ApaHead({ children }: { children: ReactNode }) {
  return (
    <thead className="border-y border-foreground/40">
      <tr>{children}</tr>
    </thead>
  );
}

export function ApaBody({ children }: { children: ReactNode }) {
  return <tbody className="border-b border-foreground/40">{children}</tbody>;
}

type CellProps = {
  children?: ReactNode;
  align?: "left" | "right" | "center";
  /** Numeric columns get tabular figures so decimal points line up. */
  numeric?: boolean;
  indent?: boolean;
  colSpan?: number;
  className?: string;
};

export function Th({ children, align = "left", colSpan, className = "" }: CellProps) {
  return (
    <th
      scope="col"
      colSpan={colSpan}
      className={`px-3 py-2 font-semibold ${
        align === "right" ? "text-right" : align === "center" ? "text-center" : "text-left"
      } ${className}`}
    >
      {children}
    </th>
  );
}

export function Td({
  children,
  align = "left",
  numeric,
  indent,
  colSpan,
  className = "",
}: CellProps) {
  return (
    <td
      colSpan={colSpan}
      className={`px-3 py-1.5 ${
        align === "right" ? "text-right" : align === "center" ? "text-center" : "text-left"
      } ${numeric ? "tabular-nums" : ""} ${indent ? "pl-7" : ""} ${className}`}
    >
      {children}
    </td>
  );
}

/** An italicised statistical symbol, e.g. <Sym>M</Sym>. */
export function Sym({ children }: { children: ReactNode }) {
  return <span className="italic">{children}</span>;
}
