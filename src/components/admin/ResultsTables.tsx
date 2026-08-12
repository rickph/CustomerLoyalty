import {
  apaBounded,
  apaNumber,
  apaP,
  apaPCell,
  apaPercent,
  interpretAlpha,
  interpretMean,
  significanceStars,
} from "@/lib/admin/apa";
import type {
  CorrelationMatrix,
  DescriptiveRow,
  FrequencyTable,
  NamedMediation,
  ReliabilityRow,
} from "@/lib/admin/results";
import type { RegressionResult } from "@/lib/admin/statistics";
import { ApaBody, ApaHead, ApaTable, Sym, Td, Th } from "./ApaTable";

export function FrequencyTables({
  tables,
  startNumber,
}: {
  tables: FrequencyTable[];
  startNumber: number;
}) {
  return (
    <ApaTable
      number={startNumber}
      title="Frequency and Percentage Distribution of the Respondents' Profile"
      note={
        <>
          <Sym>N</Sym> varies by item because each profile question is counted among the
          respondents who answered it. Percentages are of the answering total for that
          characteristic.
        </>
      }
    >
      <ApaHead>
        <Th>Characteristic</Th>
        <Th align="right">
          <Sym>f</Sym>
        </Th>
        <Th align="right">%</Th>
      </ApaHead>
      <ApaBody>
        {tables.map((table) => (
          <Fragmented key={table.title}>
            <tr>
              <Td className="pt-3 font-semibold" colSpan={3}>
                {table.title} <span className="font-normal text-foreground/50">(n = {table.total})</span>
              </Td>
            </tr>
            {table.rows.map((row) => (
              <tr key={`${table.title}-${row.label}`}>
                <Td indent>{row.label}</Td>
                <Td align="right" numeric>
                  {row.count}
                </Td>
                <Td align="right" numeric>
                  {apaPercent(row.count, table.total)}
                </Td>
              </tr>
            ))}
          </Fragmented>
        ))}
      </ApaBody>
    </ApaTable>
  );
}

export function ReliabilityTable({
  rows,
  number,
}: {
  rows: ReliabilityRow[];
  number: number;
}) {
  return (
    <ApaTable
      number={number}
      title="Internal Consistency Reliability of the Study Instruments"
      note={
        <>
          Cronbach&apos;s <Sym>α</Sym> computed on complete cases for each scale. Values of .70
          and above are conventionally treated as acceptable for research use.
        </>
      }
    >
      <ApaHead>
        <Th>Scale</Th>
        <Th align="right">Items</Th>
        <Th align="right">
          <Sym>n</Sym>
        </Th>
        <Th align="right">
          Cronbach&apos;s <Sym>α</Sym>
        </Th>
        <Th>Interpretation</Th>
      </ApaHead>
      <ApaBody>
        {rows.map((row) => (
          <tr key={row.label}>
            <Td>{row.label}</Td>
            <Td align="right" numeric>
              {row.items}
            </Td>
            <Td align="right" numeric>
              {row.n}
            </Td>
            <Td align="right" numeric>
              {apaBounded(row.alpha)}
            </Td>
            <Td>{interpretAlpha(row.alpha)}</Td>
          </tr>
        ))}
      </ApaBody>
    </ApaTable>
  );
}

export function DescriptivesTable({
  rows,
  number,
}: {
  rows: DescriptiveRow[];
  number: number;
}) {
  return (
    <ApaTable
      number={number}
      title="Means, Standard Deviations, and Verbal Interpretation of the Study Variables"
      note={
        <>
          Scores are means of the constituent items on a five-point scale. Verbal interpretation
          follows the study&apos;s scoring guide: 4.21–5.00 Very High, 3.41–4.20 High, 2.61–3.40
          Moderate, 1.81–2.60 Low, 1.00–1.80 Very Low.
        </>
      }
    >
      <ApaHead>
        <Th>Variable</Th>
        <Th align="right">
          <Sym>n</Sym>
        </Th>
        <Th align="right">
          <Sym>M</Sym>
        </Th>
        <Th align="right">
          <Sym>SD</Sym>
        </Th>
        <Th>Interpretation</Th>
      </ApaHead>
      <ApaBody>
        {rows.map((row) => (
          <tr key={`${row.parent ?? ""}-${row.label}`}>
            <Td indent={Boolean(row.parent)} className={row.parent ? "" : "font-semibold"}>
              {row.label}
            </Td>
            <Td align="right" numeric>
              {row.n}
            </Td>
            <Td align="right" numeric>
              {apaNumber(row.mean)}
            </Td>
            <Td align="right" numeric>
              {apaNumber(row.sd)}
            </Td>
            <Td>{interpretMean(row.mean)}</Td>
          </tr>
        ))}
      </ApaBody>
    </ApaTable>
  );
}

export function CorrelationTable({
  matrix,
  number,
}: {
  matrix: CorrelationMatrix;
  number: number;
}) {
  return (
    <ApaTable
      number={number}
      title="Intercorrelations Among the Study Variables"
      note={
        <>
          Pearson product-moment correlations, two-tailed. <Sym>n</Sym> is the number of
          respondents with complete scores on both variables. * <Sym>p</Sym> &lt; .05. **{" "}
          <Sym>p</Sym> &lt; .01. *** <Sym>p</Sym> &lt; .001.
        </>
      }
    >
      <ApaHead>
        <Th>Variable</Th>
        {matrix.labels.map((_, i) => (
          <Th key={i} align="right">
            {i + 1}
          </Th>
        ))}
      </ApaHead>
      <ApaBody>
        {matrix.labels.map((label, i) => (
          <tr key={label}>
            <Td>
              {i + 1}. {label}
            </Td>
            {matrix.labels.map((__, j) => {
              const cell = matrix.cells[i][j];
              if (j === i) {
                return (
                  <Td key={j} align="right" numeric>
                    —
                  </Td>
                );
              }
              if (!cell) {
                return <Td key={j} align="right" />;
              }
              return (
                <Td key={j} align="right" numeric>
                  {apaBounded(cell.r)}
                  {significanceStars(cell.p)}
                </Td>
              );
            })}
          </tr>
        ))}
      </ApaBody>
    </ApaTable>
  );
}

export function RegressionTable({
  result,
  outcome,
  number,
}: {
  result: RegressionResult;
  outcome: string;
  number: number;
}) {
  return (
    <ApaTable
      number={number}
      title={`Multiple Regression Analysis Predicting ${outcome}`}
      note={
        <>
          <Sym>N</Sym> = {result.n}. <Sym>R</Sym>
          <sup>2</sup> = {apaBounded(result.rSquared)}, adjusted <Sym>R</Sym>
          <sup>2</sup> = {apaBounded(result.adjustedRSquared)}, <Sym>F</Sym>({result.df1},{" "}
          {result.df2}) = {apaNumber(result.f)}, <Sym>p</Sym> {apaP(result.pValue)}.{" "}
          <Sym>B</Sym> is the unstandardized coefficient and <Sym>β</Sym> the standardized
          coefficient.
        </>
      }
    >
      <ApaHead>
        <Th>Predictor</Th>
        <Th align="right">
          <Sym>B</Sym>
        </Th>
        <Th align="right">
          <Sym>SE</Sym>
        </Th>
        <Th align="right">
          <Sym>β</Sym>
        </Th>
        <Th align="right">
          <Sym>t</Sym>
        </Th>
        <Th align="right">
          <Sym>p</Sym>
        </Th>
      </ApaHead>
      <ApaBody>
        {[result.intercept, ...result.coefficients].map((c) => (
          <tr key={c.name}>
            <Td>{c.name}</Td>
            <Td align="right" numeric>
              {apaNumber(c.b)}
            </Td>
            <Td align="right" numeric>
              {apaNumber(c.se)}
            </Td>
            <Td align="right" numeric>
              {Number.isFinite(c.beta) ? apaBounded(c.beta) : "—"}
            </Td>
            <Td align="right" numeric>
              {apaNumber(c.t)}
            </Td>
            <Td align="right" numeric>
              {apaPCell(c.p)}
            </Td>
          </tr>
        ))}
      </ApaBody>
    </ApaTable>
  );
}

export function MediationTable({
  mediations,
  number,
}: {
  mediations: NamedMediation[];
  number: number;
}) {
  return (
    <ApaTable
      number={number}
      title="Indirect Effects of the Predictors on Customer Loyalty Through Trust"
      note={
        <>
          Unstandardized coefficients. <Sym>a</Sym> is the predictor→mediator path,{" "}
          <Sym>b</Sym> the mediator→outcome path controlling for the predictor, <Sym>c</Sym> the
          total effect and <Sym>c&apos;</Sym> the direct effect. The indirect effect{" "}
          <Sym>ab</Sym> is tested with a percentile bootstrap (
          {mediations[0]?.result.bootSamples.toLocaleString("en-PH")} resamples); an interval
          excluding zero indicates mediation. Estimated by ordinary least squares, not PLS-SEM.
        </>
      }
    >
      <ApaHead>
        <Th>Path</Th>
        <Th align="right">
          <Sym>a</Sym>
        </Th>
        <Th align="right">
          <Sym>b</Sym>
        </Th>
        <Th align="right">
          <Sym>c</Sym>
        </Th>
        <Th align="right">
          <Sym>c&apos;</Sym>
        </Th>
        <Th align="right">
          <Sym>ab</Sym>
        </Th>
        <Th align="right">95% CI</Th>
      </ApaHead>
      <ApaBody>
        {mediations.map(({ predictor, mediator, outcome, result }) => (
          <tr key={predictor}>
            <Td>
              {predictor} → {mediator} → {outcome}
            </Td>
            <Td align="right" numeric>
              {apaNumber(result.a.b)}
            </Td>
            <Td align="right" numeric>
              {apaNumber(result.b.b)}
            </Td>
            <Td align="right" numeric>
              {apaNumber(result.totalEffect.b)}
            </Td>
            <Td align="right" numeric>
              {apaNumber(result.directEffect.b)}
            </Td>
            <Td align="right" numeric>
              {apaNumber(result.indirectEffect)}
            </Td>
            <Td align="right" numeric>
              [{apaNumber(result.bootLower)}, {apaNumber(result.bootUpper)}]
              {result.significant ? "*" : ""}
            </Td>
          </tr>
        ))}
      </ApaBody>
    </ApaTable>
  );
}

/** Table bodies can't take a bare fragment with a key, so this names one. */
function Fragmented({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
