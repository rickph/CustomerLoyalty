-- Run this once against your Railway Postgres database, e.g.:
--   psql "$DATABASE_URL" -f db/schema.sql
-- or paste it into Railway's dashboard "Query" tab for the Postgres service.

create extension if not exists pgcrypto;

create table if not exists survey_responses (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  is_qualified boolean not null default true,

  -- Raw answer blobs, kept 1:1 with src/lib/survey/questionnaire.ts so the
  -- shape can evolve without a migration every time a question changes.
  screening jsonb not null,
  demographics jsonb not null,
  answers jsonb not null default '{}'::jsonb,

  -- Denormalized location columns, purely so the admin export/dashboard can
  -- filter and group without unpacking JSON every time.
  region_code text,
  region_name text,
  province_name text,
  city_name text
);

create index if not exists survey_responses_created_at_idx on survey_responses (created_at desc);
create index if not exists survey_responses_region_idx on survey_responses (region_code);

-- No row-level security policies here: unlike Supabase, this database has
-- no public REST layer sitting in front of it. It's only ever reachable
-- through DATABASE_URL, which is held server-side (API routes / server
-- components) and never sent to the browser.
