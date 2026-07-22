import postgres from "postgres";

/**
 * Server-only Postgres client (Railway or any Postgres host). Only ever
 * imported from API routes / server components — the connection string
 * must never reach the browser.
 *
 * Kept as a lazily-created module-level singleton so warm serverless
 * invocations reuse the same connection instead of opening a new one per
 * request; the small pool cap keeps us well under typical managed-Postgres
 * connection limits at this survey's scale.
 */
let sql: ReturnType<typeof postgres> | null = null;

export function getDb() {
  if (!sql) {
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
      throw new Error("Missing DATABASE_URL environment variable. See .env.example.");
    }
    sql = postgres(connectionString, { max: 5 });
  }
  return sql;
}
