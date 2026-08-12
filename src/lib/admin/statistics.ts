/**
 * Inferential statistics for the admin dashboard.
 *
 * Everything here is a dependency-free implementation so the numbers can be
 * recomputed on the server without shipping a stats package. The estimators
 * match what the manuscript's "Statistical Treatment of Data" section calls
 * for: descriptives, Cronbach's alpha, Pearson's r, OLS multiple regression,
 * and a bootstrapped test of the indirect (mediated) effect.
 *
 * IMPORTANT: the manuscript specifies PLS-SEM (SmartPLS) for the structural
 * model. The mediation reported here is covariance-based OLS path analysis
 * (equivalent to Hayes PROCESS model 4), which is a *different estimator* and
 * will not reproduce PLS-SEM output. Treat these figures as a live check on
 * data quality during collection, and run the confirmatory analysis on the
 * exported CSV.
 */

// ---------------------------------------------------------------- primitives

export function mean(xs: number[]): number {
  if (xs.length === 0) return NaN;
  let total = 0;
  for (const x of xs) total += x;
  return total / xs.length;
}

/** Sample variance (n − 1 denominator), which is what SPSS and APA reporting use. */
export function variance(xs: number[]): number {
  const n = xs.length;
  if (n < 2) return NaN;
  const m = mean(xs);
  let ss = 0;
  for (const x of xs) ss += (x - m) ** 2;
  return ss / (n - 1);
}

export function sd(xs: number[]): number {
  return Math.sqrt(variance(xs));
}

// ------------------------------------------------- distribution tail helpers

/** Lanczos approximation to ln Γ(z); accurate to ~15 significant figures for z > 0. */
function lnGamma(z: number): number {
  const g = [
    676.5203681218851, -1259.1392167224028, 771.32342877765313,
    -176.61502916214059, 12.507343278686905, -0.13857109526572012,
    9.9843695780195716e-6, 1.5056327351493116e-7,
  ];
  if (z < 0.5) {
    // Reflection formula keeps the series in its convergent range.
    return Math.log(Math.PI / Math.sin(Math.PI * z)) - lnGamma(1 - z);
  }
  z -= 1;
  let x = 0.99999999999980993;
  for (let i = 0; i < g.length; i++) x += g[i] / (z + i + 1);
  const t = z + g.length - 0.5;
  return 0.5 * Math.log(2 * Math.PI) + (z + 0.5) * Math.log(t) - t + Math.log(x);
}

/** Continued-fraction expansion used by the regularized incomplete beta function. */
function betaContinuedFraction(a: number, b: number, x: number): number {
  const MAX_ITER = 300;
  const EPS = 3e-16;
  const TINY = 1e-300;

  const qab = a + b;
  const qap = a + 1;
  const qam = a - 1;
  let c = 1;
  let d = 1 - (qab * x) / qap;
  if (Math.abs(d) < TINY) d = TINY;
  d = 1 / d;
  let h = d;

  for (let m = 1; m <= MAX_ITER; m++) {
    const m2 = 2 * m;
    let numerator = (m * (b - m) * x) / ((qam + m2) * (a + m2));
    d = 1 + numerator * d;
    if (Math.abs(d) < TINY) d = TINY;
    c = 1 + numerator / c;
    if (Math.abs(c) < TINY) c = TINY;
    d = 1 / d;
    h *= d * c;

    numerator = (-(a + m) * (qab + m) * x) / ((a + m2) * (qap + m2));
    d = 1 + numerator * d;
    if (Math.abs(d) < TINY) d = TINY;
    c = 1 + numerator / c;
    if (Math.abs(c) < TINY) c = TINY;
    d = 1 / d;
    const delta = d * c;
    h *= delta;
    if (Math.abs(delta - 1) < EPS) break;
  }
  return h;
}

/** Regularized incomplete beta I_x(a, b) — the tail integral both t and F reduce to. */
function incompleteBeta(a: number, b: number, x: number): number {
  if (!Number.isFinite(x)) return NaN;
  if (x <= 0) return 0;
  if (x >= 1) return 1;
  const front = Math.exp(
    lnGamma(a + b) - lnGamma(a) - lnGamma(b) + a * Math.log(x) + b * Math.log(1 - x)
  );
  // The fraction only converges quickly on one side of the mode, so flip when needed.
  return x < (a + 1) / (a + b + 2)
    ? (front * betaContinuedFraction(a, b, x)) / a
    : 1 - (front * betaContinuedFraction(b, a, 1 - x)) / b;
}

/** Two-tailed p for Student's t. */
export function pFromT(t: number, df: number): number {
  if (!Number.isFinite(t) || df <= 0) return NaN;
  return incompleteBeta(df / 2, 0.5, df / (df + t * t));
}

/** Upper-tail p for the F distribution (regression omnibus test is one-tailed by construction). */
export function pFromF(f: number, df1: number, df2: number): number {
  if (!Number.isFinite(f) || f <= 0 || df1 <= 0 || df2 <= 0) return NaN;
  return incompleteBeta(df2 / 2, df1 / 2, df2 / (df2 + df1 * f));
}

// ------------------------------------------------------------- reliability

export type AlphaResult = {
  alpha: number;
  items: number;
  n: number;
};

/**
 * Cronbach's alpha from a case × item matrix (one row per respondent).
 * Rows with any missing item are dropped listwise, matching SPSS's default.
 */
export function cronbachAlpha(rows: number[][]): AlphaResult {
  const complete = rows.filter(
    (r) => r.length > 0 && r.every((v) => typeof v === "number" && Number.isFinite(v))
  );
  const k = complete[0]?.length ?? 0;
  const n = complete.length;
  if (k < 2 || n < 2) return { alpha: NaN, items: k, n };

  let sumItemVariance = 0;
  for (let i = 0; i < k; i++) {
    sumItemVariance += variance(complete.map((r) => r[i]));
  }
  const totalVariance = variance(complete.map((r) => r.reduce((a, b) => a + b, 0)));
  if (!Number.isFinite(totalVariance) || totalVariance === 0) return { alpha: NaN, items: k, n };

  return {
    alpha: (k / (k - 1)) * (1 - sumItemVariance / totalVariance),
    items: k,
    n,
  };
}

// ------------------------------------------------------------- correlation

export type CorrelationResult = {
  r: number;
  n: number;
  df: number;
  t: number;
  p: number;
};

/** Pearson product-moment correlation with its two-tailed significance test. */
export function pearson(xs: number[], ys: number[]): CorrelationResult {
  const pairs: [number, number][] = [];
  for (let i = 0; i < Math.min(xs.length, ys.length); i++) {
    if (Number.isFinite(xs[i]) && Number.isFinite(ys[i])) pairs.push([xs[i], ys[i]]);
  }
  const n = pairs.length;
  const empty = { r: NaN, n, df: Math.max(0, n - 2), t: NaN, p: NaN };
  if (n < 3) return empty;

  const mx = mean(pairs.map((p) => p[0]));
  const my = mean(pairs.map((p) => p[1]));
  let sxy = 0;
  let sxx = 0;
  let syy = 0;
  for (const [x, y] of pairs) {
    sxy += (x - mx) * (y - my);
    sxx += (x - mx) ** 2;
    syy += (y - my) ** 2;
  }
  if (sxx === 0 || syy === 0) return empty;

  const r = sxy / Math.sqrt(sxx * syy);
  const df = n - 2;
  // A perfect correlation has no residual variance, so the t ratio diverges.
  const t = Math.abs(r) >= 1 ? Infinity : (r * Math.sqrt(df)) / Math.sqrt(1 - r * r);
  return { r, n, df, t, p: Number.isFinite(t) ? pFromT(t, df) : 0 };
}

// --------------------------------------------------------------- regression

export type Coefficient = {
  name: string;
  b: number;
  se: number;
  beta: number; // standardized
  t: number;
  p: number;
};

export type RegressionResult = {
  n: number;
  predictors: string[];
  intercept: Coefficient;
  coefficients: Coefficient[];
  r: number;
  rSquared: number;
  adjustedRSquared: number;
  f: number;
  df1: number;
  df2: number;
  pValue: number;
  standardError: number; // SE of the estimate
};

/** Gauss-Jordan inverse with partial pivoting. Returns null for a singular matrix. */
function invert(matrix: number[][]): number[][] | null {
  const n = matrix.length;
  const a = matrix.map((row, i) => [
    ...row,
    ...Array.from({ length: n }, (_, j) => (i === j ? 1 : 0)),
  ]);

  for (let col = 0; col < n; col++) {
    let pivot = col;
    for (let row = col + 1; row < n; row++) {
      if (Math.abs(a[row][col]) > Math.abs(a[pivot][col])) pivot = row;
    }
    if (Math.abs(a[pivot][col]) < 1e-12) return null;
    [a[col], a[pivot]] = [a[pivot], a[col]];

    const div = a[col][col];
    for (let j = 0; j < 2 * n; j++) a[col][j] /= div;

    for (let row = 0; row < n; row++) {
      if (row === col) continue;
      const factor = a[row][col];
      if (factor === 0) continue;
      for (let j = 0; j < 2 * n; j++) a[row][j] -= factor * a[col][j];
    }
  }
  return a.map((row) => row.slice(n));
}

/**
 * OLS multiple regression of `y` on the columns of `predictors`.
 * `predictors` is keyed by name so the coefficient table can label itself.
 */
export function linearRegression(
  y: number[],
  predictors: { name: string; values: number[] }[]
): RegressionResult | null {
  const k = predictors.length;
  const names = predictors.map((p) => p.name);

  // Listwise deletion across the outcome and every predictor.
  const keep: number[] = [];
  for (let i = 0; i < y.length; i++) {
    if (!Number.isFinite(y[i])) continue;
    if (predictors.some((p) => !Number.isFinite(p.values[i]))) continue;
    keep.push(i);
  }
  const n = keep.length;
  if (k === 0 || n < k + 2) return null;

  const yv = keep.map((i) => y[i]);
  const xv = predictors.map((p) => keep.map((i) => p.values[i]));

  // Design matrix with a leading intercept column.
  const X: number[][] = keep.map((_, row) => [1, ...xv.map((col) => col[row])]);
  const p = k + 1;

  const xtx: number[][] = Array.from({ length: p }, () => Array<number>(p).fill(0));
  const xty: number[] = Array<number>(p).fill(0);
  for (let row = 0; row < n; row++) {
    for (let i = 0; i < p; i++) {
      xty[i] += X[row][i] * yv[row];
      for (let j = 0; j < p; j++) xtx[i][j] += X[row][i] * X[row][j];
    }
  }

  const inv = invert(xtx);
  if (!inv) return null;

  const b = inv.map((row) => row.reduce((sum, v, j) => sum + v * xty[j], 0));

  const meanY = mean(yv);
  let sse = 0;
  let sst = 0;
  for (let row = 0; row < n; row++) {
    const fitted = X[row].reduce((sum, v, j) => sum + v * b[j], 0);
    sse += (yv[row] - fitted) ** 2;
    sst += (yv[row] - meanY) ** 2;
  }
  const df2 = n - k - 1;
  if (df2 <= 0 || sst === 0) return null;

  const mse = sse / df2;
  const rSquared = 1 - sse / sst;
  const adjustedRSquared = 1 - (1 - rSquared) * ((n - 1) / df2);
  const f = (rSquared / k) / ((1 - rSquared) / df2);

  const sdY = sd(yv);
  const build = (index: number, name: string): Coefficient => {
    const se = Math.sqrt(mse * inv[index][index]);
    const t = se === 0 ? NaN : b[index] / se;
    // Standardized beta is only defined for the slopes, not the intercept.
    const beta = index === 0 ? NaN : (b[index] * sd(xv[index - 1])) / sdY;
    return { name, b: b[index], se, beta, t, p: pFromT(t, df2) };
  };

  return {
    n,
    predictors: names,
    intercept: build(0, "(Constant)"),
    coefficients: names.map((name, i) => build(i + 1, name)),
    r: Math.sqrt(Math.max(0, rSquared)),
    rSquared,
    adjustedRSquared,
    f,
    df1: k,
    df2,
    pValue: pFromF(f, k, df2),
    standardError: Math.sqrt(mse),
  };
}

// ---------------------------------------------------------------- mediation

export type MediationResult = {
  n: number;
  /** X → M */
  a: Coefficient;
  /** M → Y controlling for X */
  b: Coefficient;
  /** X → Y, total effect */
  totalEffect: Coefficient;
  /** X → Y controlling for M */
  directEffect: Coefficient;
  indirectEffect: number;
  bootLower: number;
  bootUpper: number;
  bootSamples: number;
  /** A percentile CI excluding zero is the standard significance criterion. */
  significant: boolean;
};

/** Deterministic PRNG so a given dataset always yields the same bootstrap CI. */
function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Simple mediation (one mediator), estimated by OLS with a percentile
 * bootstrap CI on the indirect effect a×b — the covariance-based analogue of
 * PROCESS model 4.
 *
 * The bootstrap is seeded so re-running the dashboard reports identical
 * confidence limits; a thesis result that changes on refresh is unciteable.
 */
export function mediationAnalysis(
  x: number[],
  m: number[],
  y: number[],
  options: { bootSamples?: number; seed?: number } = {}
): MediationResult | null {
  const bootSamples = options.bootSamples ?? 5000;
  const seed = options.seed ?? 20260812;

  const rows: [number, number, number][] = [];
  for (let i = 0; i < Math.min(x.length, m.length, y.length); i++) {
    if (Number.isFinite(x[i]) && Number.isFinite(m[i]) && Number.isFinite(y[i])) {
      rows.push([x[i], m[i], y[i]]);
    }
  }
  const n = rows.length;
  if (n < 10) return null;

  const xs = rows.map((r) => r[0]);
  const ms = rows.map((r) => r[1]);
  const ys = rows.map((r) => r[2]);

  const pathA = linearRegression(ms, [{ name: "X", values: xs }]);
  const pathTotal = linearRegression(ys, [{ name: "X", values: xs }]);
  const pathBoth = linearRegression(ys, [
    { name: "X", values: xs },
    { name: "M", values: ms },
  ]);
  if (!pathA || !pathTotal || !pathBoth) return null;

  const a = pathA.coefficients[0];
  const direct = pathBoth.coefficients[0];
  const b = pathBoth.coefficients[1];

  const random = mulberry32(seed);
  const indirects: number[] = [];
  const bx = new Array<number>(n);
  const bm = new Array<number>(n);
  const by = new Array<number>(n);

  for (let s = 0; s < bootSamples; s++) {
    for (let i = 0; i < n; i++) {
      const pick = Math.floor(random() * n);
      bx[i] = rows[pick][0];
      bm[i] = rows[pick][1];
      by[i] = rows[pick][2];
    }
    const ra = linearRegression(bm, [{ name: "X", values: bx }]);
    const rb = linearRegression(by, [
      { name: "X", values: bx },
      { name: "M", values: bm },
    ]);
    // Resamples can be degenerate (e.g. every case identical); skip those.
    if (ra && rb) indirects.push(ra.coefficients[0].b * rb.coefficients[1].b);
  }

  if (indirects.length < 100) return null;
  indirects.sort((p, q) => p - q);
  const at = (q: number) => {
    const idx = Math.min(indirects.length - 1, Math.max(0, Math.round(q * (indirects.length - 1))));
    return indirects[idx];
  };
  const lower = at(0.025);
  const upper = at(0.975);

  return {
    n,
    a,
    b,
    totalEffect: pathTotal.coefficients[0],
    directEffect: direct,
    indirectEffect: a.b * b.b,
    bootLower: lower,
    bootUpper: upper,
    bootSamples: indirects.length,
    significant: (lower > 0 && upper > 0) || (lower < 0 && upper < 0),
  };
}
