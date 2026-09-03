// Auto-migration entrypoint — brings a brand-new (or outdated) database up to
// the full schema the app expects by running src/db/bootstrap.ts's idempotent
// DDL (enums, tables, indexes, additive columns — every statement is
// CREATE … IF NOT EXISTS / DO-block guarded).
//
// Vercel runs this on every build (see vercel.json "buildCommand") so the
// migration happens once per deploy, before any traffic is routed to the new
// deployment. It is equally safe to run locally against any DATABASE_URL.
import { ensureSchema } from "../src/db/bootstrap";

async function main() {
  if (!process.env.DATABASE_URL) {
    const isProd = process.env.VERCEL_ENV === "production";
    console.error(
      isProd
        ? "[auto-migrate] FATAL: DATABASE_URL is not set. Add it in Vercel → Project → Settings → Environment Variables (Production), then redeploy."
        : "[auto-migrate] DATABASE_URL not set — skipping schema migration (non-production build).",
    );
    process.exit(isProd ? 1 : 0);
  }

  await ensureSchema();
  console.log("[auto-migrate] Database schema is up to date.");
  process.exit(0);
}

main().catch((error) => {
  console.error("[auto-migrate] Failed to migrate database:", error);
  process.exit(1);
});
