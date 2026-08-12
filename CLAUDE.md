# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## What this is

A mobile-first survey web app for a PhD thesis on customer loyalty in fitness-firm memberships across the Philippines. Respondents go through a multi-step wizard (screening → profile → 14 Likert-scale dimension steps); a password-protected `/admin` page shows response stats and exports a CSV for SPSS/Excel.

## Commands

```bash
npm run dev      # dev server (Turbopack), http://localhost:3000
npm run build    # production build
npm run start    # run the production build
npm run lint      # eslint
npm run verify:stats  # checks src/lib/admin/statistics.ts against known values
```

There is no test framework. The one thing that *is* verified is the statistics
module, because it produces numbers that go into a doctoral thesis:
`scripts/verify-statistics.ts` checks the t and F tail probabilities against
published critical values, Cronbach's alpha against a hand-computed case, and
the regression path against five identities that must hold for simple
regression (`R² = r²`, `b = r·SDy/SDx`, `β = r`, `t_slope = t_r`, `F = t²`).
Run it after touching anything in that file.

Database schema lives in `db/schema.sql` — apply it once against a fresh Postgres instance with `psql "$DATABASE_URL" -f db/schema.sql` (or paste into Railway's dashboard Query tab). There is no migration tooling; schema changes are hand-applied SQL.

Required env vars (see `.env.example`): `DATABASE_URL` (Postgres, e.g. Railway), `ADMIN_PASSWORD`, `ADMIN_SESSION_SECRET`.

## Architecture

### The questionnaire is one file

**`src/lib/survey/questionnaire.ts`** is the single source of truth for every question in the survey: `SCREENING_QUESTIONS` (consent + eligibility, "No" disqualifies), `PROFILE_FIELDS` (respondent profile — choice/number/text), `CONSTRUCT_SECTIONS` (the 14 Likert dimension steps, grouped by `part` into the four constructs), and `LIKERT_SCALE`. Everything downstream — the wizard's rendering and step order, `src/lib/survey/schema.ts`'s zod validation, CSV column names/order (`src/lib/admin/csv.ts`), and the admin dashboard's charts (`src/lib/admin/analytics.ts`) — is generated from these exports. Adding, removing, or reordering questions needs no other code changes.

`id` values on every question become column names in the exported CSV and keys in the `screening`/`demographics`/`answers` JSONB blobs — treat them as a stable public interface once real responses exist. Renaming an `id` after data collection has started looks like a new column, not a rename.

The wizard renders one step per dimension (not per construct) so a respondent never faces more than 5 statements at once — `CONSTRUCT_SECTIONS` has 14 entries (5 dimensions × Service Quality, 3 × Customer Engagement, 3 × Trust, 3 × Customer Loyalty), each carrying a `part` field used to roll dimension scores back up to their construct for analytics.

### Survey submission flow

`SurveyWizard.tsx` (client component) drives a react-hook-form instance validated by `surveyResponseSchema` (`src/lib/survey/schema.ts`), auto-saving progress to `localStorage` (`gls-survey-draft-v1`) so respondents can resume. A "No" answer on any screening question short-circuits to a disqualification screen without hitting the network. On submit, `POST /api/submit` re-validates server-side, re-checks disqualification (defense in depth — the wizard should already prevent this), and inserts one row into `survey_responses` as three JSONB blobs (`screening`, `demographics`, `answers`) plus denormalized `region_code`/`region_name`/`province_name`/`city_name` columns for the admin dashboard to filter/group on without unpacking JSON.

### Location data

Region → province → city selection (`LocationPicker.tsx` + `src/lib/ph-locations.ts`) is served from bundled JSON under `public/data/ph-locations/` (sourced from `github.com/isaacdarcilla/philippine-addresses`) instead of a third-party API, so data collection doesn't depend on an external service staying up and stays fast on mobile data. Regions/provinces/cities are fetched once client-side and cached in memory; province/city lists are filtered from the full dataset by region/province code.

### Admin dashboard

Auth is a single shared password (`ADMIN_PASSWORD`), not per-user accounts: `POST /api/admin/login` checks it and sets an httpOnly signed session cookie (`gls_admin_session`, HMAC-SHA256 via `ADMIN_SESSION_SECRET`, 12h TTL) — see `src/lib/admin/auth.ts`. `src/app/admin/page.tsx` is a server component that reads the cookie directly and renders either the login form or the dashboard. `GET /api/admin/export` streams all rows as CSV.

The dashboard is **unlisted by design**: nothing in the respondent-facing UI links to `/admin`, and the route sets `robots: noindex, nofollow`. Reaching it means knowing the URL *and* the password. Don't add an admin link to the public shell.

### Statistics

The dashboard reports real inferential statistics, formatted to APA 7 so the tables can go straight into the results chapter. Three layers:

- **`src/lib/admin/statistics.ts`** — dependency-free estimators: sample variance/SD, Cronbach's alpha, Pearson's *r* with its *t* test, OLS multiple regression (normal equations + Gauss-Jordan inverse, giving *B*, *SE*, *β*, *t*, *p*, *R²*, adjusted *R²*, *F*), and simple mediation with a percentile bootstrap on the indirect effect. Tail probabilities come from a regularized incomplete beta function, so no stats package is needed. The bootstrap uses a **seeded** PRNG — a confidence interval that changes on page refresh would be unciteable.
- **`src/lib/admin/results.ts`** — turns raw rows into scored cases (a dimension score is the mean of its items; a construct score the mean of all its items) and builds the table data. Constructs are derived from the `part` field on `CONSTRUCT_SECTIONS`, so adding a dimension flows through automatically.
- **`src/lib/admin/apa.ts`** — APA number formatting. The rule that bites: statistics bounded by 1 (*r*, *p*, α, β, *R²*) are written without a leading zero (`.62`), everything else keeps it (`M = 3.94`).

**The estimator caveat matters.** The manuscript's methodology chapter specifies PLS-SEM in SmartPLS. What the app computes is covariance-based OLS path analysis (equivalent to PROCESS model 4). These are different estimators and will not agree. The dashboard says so on screen; keep that notice if you touch the page. The app is for watching data quality during collection — the confirmatory analysis runs on the exported CSV.

### Filters and exports

`src/lib/admin/filters.ts` holds one filter set (period, region, gym type, visit frequency) that scopes the entire dashboard. State lives in the **URL**, which is what makes the exports trustworthy: the export links carry the same query string, so a downloaded file always matches what was on screen. `applyFilters` is generic over a minimal row shape so the page, the CSV route and the xlsx route all slice identically — if you add a filter, add it there and everything follows.

Three exports, all password-gated:

- `GET /api/admin/export` — raw CSV, unchanged shape, now filter-aware.
- `GET /api/admin/export/xlsx` — a full workbook: raw responses (with computed construct scores appended) plus one sheet per results table, and an *About* sheet recording the filter and the estimator caveat. Built by `src/lib/admin/workbook.ts` on top of `src/lib/admin/xlsx.ts`, a **dependency-free** xlsx writer — an xlsx is a ZIP of XML and Node ships DEFLATE, so no spreadsheet library is needed. Strings are written inline rather than via a shared-string table.
- **PDF** is the browser's own print-to-PDF (`window.print()`), driven by the `@media print` block in `globals.css`. That block forces the light palette, keeps chart fills with `print-color-adjust: exact`, and sets `break-inside: avoid` on tables so an APA table never splits across pages. There is no server-side PDF generation and no headless browser.

One rule for the workbook: **p values must never round to 0.** `pValue()` keeps significant digits so a tiny p exports as `4.24E-33` rather than a flat zero, which would be unreportable.

### Theming

Three states, not two: an explicit choice stamps `data-theme` on `<html>`; the default "system" stamps nothing and resolves via `prefers-color-scheme`. `globals.css` therefore declares the dark tokens twice — once behind the media query (guarded with `:root:not([data-theme="light"])` so an explicit light choice still wins on a dark OS) and once behind `:root[data-theme="dark"]`. `ThemeToggle.tsx` exports `themeInitScript`, which `layout.tsx` runs inline in `<head>` so the saved theme applies before first paint; the toggle itself reads storage through `useSyncExternalStore`, which avoids both a hydration mismatch and a setState-in-effect lint error.

Chart series colours (`--series-*`, `--scale-*`) are separate from `--brand` and are **only** used inside chart marks: brand teal means "interactive", a series colour never does. The four series hues were checked for colour-vision separation against both surfaces.

### Database access

`src/lib/db/client.ts` exports `getDb()`, a lazily-created module-level `postgres.js` singleton (capped at 5 connections) so warm serverless invocations reuse the connection. It reads `DATABASE_URL` directly — **only ever import this from API routes or server components**; the connection string must never reach the browser. There's no ORM; queries are raw tagged-template SQL.

### Deployment

Deploys to Railway via a GitHub-connected service with auto-deploy on push to `main`, separate from the Railway Postgres service (same Railway project, so the app can use Postgres's private-network connection string). Vercel is also supported (see README's Deploying section) using Railway's *public* `DATABASE_URL` instead, since Vercel isn't on Railway's private network.
