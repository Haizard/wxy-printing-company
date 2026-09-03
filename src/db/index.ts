import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

// Connection string from environment variable
const connectionString = process.env.DATABASE_URL!;

if (!connectionString) {
  console.warn(
    "[wxy-api] DATABASE_URL is not set — database calls will fail until it is configured.",
  );
}

// For SSL connections (required by Luceris)
const client = postgres(connectionString, {
  ssl: "require",
});

export const db = drizzle(client, { schema });
