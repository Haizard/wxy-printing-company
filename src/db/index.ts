import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

// Connection string from environment variable
const connectionString = process.env.DATABASE_URL!;

// For SSL connections (required by Luceris)
const client = postgres(connectionString, {
  ssl: "require",
});

export const db = drizzle(client, { schema });
