import {
  mean, sd, variance, pFromT, pFromF, cronbachAlpha, pearson,
  linearRegression, mediationAnalysis,
} from "../src/lib/admin/statistics.ts";

let pass = 0, fail = 0;
function check(name: string, actual: number, expected: number, tol: number) {
  const ok = Number.isFinite(actual) && Math.abs(actual - expected) <= tol;
  if (ok) { pass++; console.log(`  PASS  ${name}  = ${actual.toFixed(6)}`); }
  else { fail++; console.log(`  FAIL  ${name}  = ${actual}  (expected ${expected} ± ${tol})`); }
}
function checkTrue(name: string, cond: boolean, detail = "") {
  if (cond) { pass++; console.log(`  PASS  ${name} ${detail}`); }
  else { fail++; console.log(`  FAIL  ${name} ${detail}`); }
}

// ── 1. t distribution vs published critical values ─────────────────────────
console.log("\n[1] Two-tailed p from t, against standard t-table critical values");
check("t=2.228, df=10  -> p=.05", pFromT(2.228, 10), 0.05, 0.0005);
check("t=2.086, df=20  -> p=.05", pFromT(2.086, 20), 0.05, 0.0005);
check("t=1.984, df=100 -> p=.05", pFromT(1.984, 100), 0.05, 0.0005);
check("t=3.169, df=10  -> p=.01", pFromT(3.169, 10), 0.01, 0.0005);
check("t=1.812, df=10  -> p=.10", pFromT(1.812, 10), 0.10, 0.0005);
check("t=4.587, df=10  -> p=.001", pFromT(4.587, 10), 0.001, 0.0001);
check("t=0,     df=10  -> p=1",   pFromT(0, 10), 1, 1e-12);

// ── 2. F distribution vs published critical values ─────────────────────────
console.log("\n[2] Upper-tail p from F, against standard F-table critical values");
check("F=4.965, df=(1,10) -> p=.05", pFromF(4.965, 1, 10), 0.05, 0.0005);
check("F=4.351, df=(1,20) -> p=.05", pFromF(4.351, 1, 20), 0.05, 0.0005);
check("F=3.098, df=(3,20) -> p=.05", pFromF(3.098, 3, 20), 0.05, 0.0005);
check("F=3.238, df=(2,30) -> p=.05", pFromF(3.316, 2, 30), 0.05, 0.0005);
check("F=8.096, df=(1,20) -> p=.01", pFromF(8.096, 1, 20), 0.01, 0.0005);

// ── 3. descriptives ────────────────────────────────────────────────────────
console.log("\n[3] Descriptives (n-1 denominator, as SPSS/APA)");
check("mean([1..5])", mean([1, 2, 3, 4, 5]), 3, 1e-12);
check("var([1..5]) = 2.5", variance([1, 2, 3, 4, 5]), 2.5, 1e-12);
check("sd([2,4,4,4,5,5,7,9]) = 2.13809", sd([2, 4, 4, 4, 5, 5, 7, 9]), 2.13808993, 1e-6);

// ── 4. Cronbach's alpha, hand-computed ─────────────────────────────────────
console.log("\n[4] Cronbach's alpha");
// items [1,2,3,4,5] and [1,3,2,5,4]: var each 2.5, total var 9
// alpha = (2/1)(1 - 5/9) = 0.888889
const alphaRows = [[1, 1], [2, 3], [3, 2], [4, 5], [5, 4]];
check("hand-computed 2-item alpha = 8/9", cronbachAlpha(alphaRows).alpha, 0.8888889, 1e-6);
check("identical items -> alpha = 1", cronbachAlpha([[1, 1], [2, 2], [3, 3], [4, 4], [5, 5]]).alpha, 1, 1e-12);
checkTrue("zero total variance -> NaN", Number.isNaN(cronbachAlpha([[1, 5], [2, 4], [3, 3], [4, 2], [5, 1]]).alpha));
checkTrue("listwise deletion drops incomplete rows",
  cronbachAlpha([[1, 1], [2, 3], [3, 2], [4, 5], [5, 4], [NaN, 2]]).n === 5,
  `n=${cronbachAlpha([[1, 1], [2, 3], [3, 2], [4, 5], [5, 4], [NaN, 2]]).n}`);

// ── 5. simple regression identities (the strongest self-check available) ───
console.log("\n[5] Simple regression must reproduce the correlation exactly");
const x = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
const y = [2, 4, 5, 4, 5, 7, 8, 9, 8, 10];
const corr = pearson(x, y);
const simple = linearRegression(y, [{ name: "x", values: x }])!;
check("R^2 = r^2", simple.rSquared, corr.r ** 2, 1e-12);
check("b = r * (sd_y / sd_x)", simple.coefficients[0].b, corr.r * (sd(y) / sd(x)), 1e-12);
check("standardized beta = r", simple.coefficients[0].beta, corr.r, 1e-12);
check("t(slope) = t(correlation)", simple.coefficients[0].t, corr.t, 1e-10);
check("F = t^2", simple.f, corr.t ** 2, 1e-9);
check("p(F) = p(t)", simple.pValue, corr.p, 1e-12);
check("df2 = n - 2", simple.df2, corr.df, 1e-12);
// Least-squares line derived from the raw sums of squares, independently of
// the library's matrix path: b = Sxy/Sxx, a = ȳ - b·x̄
const mx0 = mean(x), my0 = mean(y);
let sxy0 = 0, sxx0 = 0;
for (let i = 0; i < x.length; i++) { sxy0 += (x[i] - mx0) * (y[i] - my0); sxx0 += (x[i] - mx0) ** 2; }
check("Sxy = 67.0", sxy0, 67.0, 1e-12);
check("Sxx = 82.5", sxx0, 82.5, 1e-12);
check("slope = Sxy/Sxx", simple.coefficients[0].b, sxy0 / sxx0, 1e-12);
check("intercept = ȳ - b·x̄", simple.intercept.b, my0 - (sxy0 / sxx0) * mx0, 1e-12);

// ── 6. multiple regression recovers a known generating equation ───────────
console.log("\n[6] Multiple regression on an exactly-determined system");
const x1 = [1, 2, 3, 4, 5, 6, 7, 8];
const x2 = [2, 1, 4, 3, 6, 5, 8, 7];
const yExact = x1.map((v, i) => 2 + 3 * v - 1 * x2[i]);
const exact = linearRegression(yExact, [
  { name: "x1", values: x1 },
  { name: "x2", values: x2 },
])!;
check("intercept = 2", exact.intercept.b, 2, 1e-9);
check("b1 = 3", exact.coefficients[0].b, 3, 1e-9);
check("b2 = -1", exact.coefficients[1].b, -1, 1e-9);
check("R^2 = 1", exact.rSquared, 1, 1e-12);
checkTrue("adjusted R^2 = 1", Math.abs(exact.adjustedRSquared - 1) < 1e-9);

// noisy version: check R^2 stays in range and adj < R^2
const yNoisy = x1.map((v, i) => 2 + 3 * v - 1 * x2[i] + [0.4, -0.3, 0.2, -0.5, 0.1, 0.3, -0.2, 0.4][i]);
const noisy = linearRegression(yNoisy, [
  { name: "x1", values: x1 },
  { name: "x2", values: x2 },
])!;
checkTrue("0 < R^2 < 1", noisy.rSquared > 0 && noisy.rSquared < 1, `R^2=${noisy.rSquared.toFixed(4)}`);
checkTrue("adjusted R^2 < R^2", noisy.adjustedRSquared < noisy.rSquared);
checkTrue("F matches R^2 formula",
  Math.abs(noisy.f - (noisy.rSquared / 2) / ((1 - noisy.rSquared) / noisy.df2)) < 1e-9);
checkTrue("listwise deletion on predictors",
  linearRegression([...yNoisy, 5], [
    { name: "x1", values: [...x1, NaN] },
    { name: "x2", values: [...x2, 3] },
  ])!.n === 8);
checkTrue("singular design returns null",
  linearRegression(y, [
    { name: "a", values: x },
    { name: "b", values: x.map((v) => v * 2) },  // perfectly collinear
  ]) === null);

// ── 7. mediation ──────────────────────────────────────────────────────────
console.log("\n[7] Mediation (OLS path analysis + seeded percentile bootstrap)");
const rng = (() => { let s = 12345; return () => { s = (s * 1103515245 + 12345) & 0x7fffffff; return s / 0x7fffffff; }; })();
const n = 300;
const mx: number[] = [], mm: number[] = [], my: number[] = [], mnoise: number[] = [];
for (let i = 0; i < n; i++) {
  const xv = rng() * 4 + 1;
  const mv = 0.8 * xv + (rng() - 0.5);          // M strongly driven by X
  const yv = 0.7 * mv + (rng() - 0.5);          // Y driven only through M
  mx.push(xv); mm.push(mv); my.push(yv); mnoise.push(rng() * 4 + 1);
}
const med = mediationAnalysis(mx, mm, my, { bootSamples: 2000 })!;
checkTrue("full mediation: indirect CI excludes 0", med.significant,
  `ab=${med.indirectEffect.toFixed(3)} CI[${med.bootLower.toFixed(3)}, ${med.bootUpper.toFixed(3)}]`);
check("indirect ≈ a*b", med.indirectEffect, med.a.b * med.b.b, 1e-12);
check("total ≈ direct + indirect", med.totalEffect.b, med.directEffect.b + med.indirectEffect, 1e-9);
checkTrue("direct effect near zero under full mediation", Math.abs(med.directEffect.b) < 0.15,
  `c'=${med.directEffect.b.toFixed(4)}`);

const noMed = mediationAnalysis(mx, mnoise, my, { bootSamples: 2000 })!;
checkTrue("unrelated mediator: CI contains 0", !noMed.significant,
  `ab=${noMed.indirectEffect.toFixed(4)} CI[${noMed.bootLower.toFixed(4)}, ${noMed.bootUpper.toFixed(4)}]`);

const rerun = mediationAnalysis(mx, mm, my, { bootSamples: 2000 })!;
checkTrue("bootstrap is deterministic across runs",
  rerun.bootLower === med.bootLower && rerun.bootUpper === med.bootUpper);
checkTrue("too few cases returns null", mediationAnalysis([1, 2, 3], [1, 2, 3], [1, 2, 3]) === null);

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail === 0 ? 0 : 1);
