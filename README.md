# Gym Membership Loyalty Survey

A mobile-first survey web app for a thesis on customer loyalty in fitness gym
memberships across the Philippines. Multi-step wizard, region/province/city
picker, autosaves progress on-device, stores responses in a Railway Postgres
database, and has a password-protected `/admin` page to check response
counts and export a CSV for SPSS/Excel.

**The questionnaire content is currently a placeholder.** See
[Swapping in the final questionnaire](#swapping-in-the-final-questionnaire) below.

## Stack

- Next.js (App Router) + TypeScript + Tailwind CSS
- react-hook-form + zod for multi-step validation
- Plain Postgres (via [Railway](https://railway.app)), accessed only from
  server-side API routes/components through `DATABASE_URL` — no database
  credentials are ever sent to the browser
- Local PH region/province/city dataset (`public/data/ph-locations/`),
  bundled instead of calling a third-party API at runtime

## Local setup

1. **Install dependencies**

   ```bash
   npm install
   ```

2. **Create a Postgres database on [Railway](https://railway.app)**: New
   Project → Provision PostgreSQL. Keep it as its own dedicated project,
   separate from any other apps/services in your Railway account.

3. **Run the schema migration** against it, e.g.:

   ```bash
   psql "$DATABASE_URL" -f db/schema.sql
   ```

   (or paste the contents of [`db/schema.sql`](db/schema.sql) into
   Railway's dashboard "Query" tab for the Postgres service)

4. **Set environment variables**: copy `.env.example` to `.env.local` and
   fill in:
   - `DATABASE_URL` — from the Postgres service's Variables tab on Railway
     (use the public connection string unless this app is deployed inside
     the same Railway project/private network)
   - `ADMIN_PASSWORD` — password to view `/admin`
   - `ADMIN_SESSION_SECRET` — any random string (e.g. `openssl rand -hex 32`)

5. **Run the dev server**

   ```bash
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000) for the survey, and
   [http://localhost:3000/admin](http://localhost:3000/admin) for the
   response dashboard.

## Swapping in the final questionnaire

Everything the survey renders (screening questions, demographics, Likert
constructs and items) is driven by a single file:

**[`src/lib/survey/questionnaire.ts`](src/lib/survey/questionnaire.ts)**

To load the final instrument, edit the arrays in that file:

- `SCREENING_QUESTIONS` — eligibility gate (e.g. "are you a gym member?")
- `DEMOGRAPHIC_FIELDS` — respondent profile questions
- `CONSTRUCT_SECTIONS` — one entry per construct (Service Quality,
  Satisfaction, Loyalty, etc.), each with its own list of Likert items; the
  wizard automatically renders one step per section, so adding/removing/
  renaming constructs or items needs no other code changes

Keep each `id` short, unique, and stable — those ids become the column
names in the exported CSV, so renaming an id after collecting responses
will look like a new column rather than a rename.

If the final scale isn't 1–5 (e.g. 7-point Likert), update `LIKERT_SCALE`
in the same file — `LikertRow` and the validation schema both read from it.

## Deploying

Deploy to [Vercel](https://vercel.com) (free tier): import the repo, add
the same environment variables from `.env.local` in the Vercel project
settings (using Railway's *public* `DATABASE_URL`, since Vercel isn't on
Railway's private network), and deploy. Share the deployed URL (or a QR
code pointing to it) as the survey link.

Alternatively, deploy directly on Railway alongside the database (New
Service → Deploy from GitHub repo in the same project) — then the app can
use the faster private network connection string instead of the public one.

## Exporting data for analysis

On `/admin`, the **Download CSV** button exports every response with one
row per respondent and one column per question — ready to import into
SPSS or Excel. Column order and names are generated from
`questionnaire.ts`, so re-exporting after editing the questionnaire always
matches the current instrument.
