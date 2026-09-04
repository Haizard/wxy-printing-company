import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

// Connection string from environment variable. If it is missing (e.g. a
// Vercel deployment where the env var wasn't added yet) we still build a
// client so the API can boot and return a clear 500 with a logged reason —
// passing `undefined` to postgres() would throw at import time and crash the
// whole function with an opaque FUNCTION_INVOCATION_FAILED.
const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error(
    "[wxy-api] DATABASE_URL is not set — every database call will fail until it is configured (add it to Vercel → Project → Settings → Environment Variables).",
  );
}

// For SSL connections (required by Luceris). Serverless safety: keep the pool
// to a single connection per function instance (default is 10, which exhausts
// small role limits under concurrent invocations) and release it after 20s of
// idle so warm instances don't hold the connection forever.
const client = postgres(connectionString || "postgres://localhost:5432/wxy_placeholder", {
  ssl: "require",
  max: 1,
  idle_timeout: 5,
  connect_timeout: 15,
  onnotice: () => {},
  onparameter: () => {},
});

export const db = drizzle(client, { schema });

// Retry helper for transient connection errors (e.g., too many connections)
export async function withRetry<T>(fn: () => Promise<T>, maxRetries = 3, delayMs = 1000): Promise<T> {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (err: any) {
      const isConnectionError =
        err?.message?.includes("too many connections") ||
        err?.message?.includes("connection refused") ||
        err?.message?.includes("ECONNREFUSED") ||
        err?.code === "53300";
      if (isConnectionError && attempt < maxRetries) {
        console.warn(`[db] Connection error (attempt ${attempt}/${maxRetries}), retrying in ${delayMs}ms...`);
        await new Promise((r) => setTimeout(r, delayMs));
        delayMs *= 2; // exponential backoff
        continue;
      }
      throw err;
    }
  }
  throw new Error("Max retries exceeded");
}
