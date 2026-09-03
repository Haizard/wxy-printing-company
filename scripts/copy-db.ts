// One-time data copy: moves every row from the current (old) database into a
// brand-new Luceris database, preserving IDs and relationships.
//
// Usage:
//   SOURCE_DATABASE_URL=<old-db-url> NEW_DATABASE_URL=<new-db-url> bun run scripts/copy-db.ts
//
// SOURCE_DATABASE_URL defaults to DATABASE_URL (the sandbox/dev connection,
// which currently points at the old database that holds your live data).
//
// What it does:
//   1. Connects to both databases (max 1 connection each — light on the old DB).
//   2. Migrates the target with the same idempotent schema bootstrap used by
//      the Vercel build, so a fresh DB gets every table/enum/index first.
//   3. Aborts if the target already contains rows (never double-copy).
//   4. Copies tables in foreign-key-safe order through drizzle (the same
//      serializer the app uses), batching inserts; categories are inserted
//      parents-first to satisfy their self-referencing FK.
//
// Connection strings are never printed.
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { count } from "drizzle-orm";
import { ensureSchemaWith } from "../src/db/bootstrap";
import * as schema from "../src/db/schema";

// Foreign-key-safe copy order (dependencies first).
const TABLES: [string, any][] = [
  ["users", schema.users],
  ["categories", schema.categories], // self-referencing parent_id — handled topologically
  ["products", schema.products],
  ["product_options", schema.productOptions],
  ["product_option_values", schema.productOptionValues],
  ["finishing_options", schema.finishingOptions],
  ["product_finishing_options", schema.productFinishingOptions],
  ["price_rules", schema.priceRules],
  ["price_bands", schema.priceBands],
  ["quotes", schema.quotes],
  ["quote_lines", schema.quoteLines],
  ["orders", schema.orders],
  ["jobs", schema.jobs],
  ["job_status_history", schema.jobStatusHistory],
  ["job_files", schema.jobFiles],
  ["inventory_items", schema.inventoryItems],
  ["inventory_movements", schema.inventoryMovements],
  ["suppliers", schema.suppliers],
  ["purchase_orders", schema.purchaseOrders],
  ["purchase_order_items", schema.purchaseOrderItems],
  ["material_issuances", schema.materialIssuances],
  ["chat_threads", schema.chatThreads],
  ["chat_messages", schema.chatMessages],
  ["contact_messages", schema.contactMessages],
];

const BATCH = 200;

function fail(message: string): never {
  console.error(`❌ ${message}`);
  process.exit(1);
}

async function main() {
  const sourceUrl = process.env.SOURCE_DATABASE_URL || process.env.DATABASE_URL;
  const targetUrl = process.env.NEW_DATABASE_URL;

  if (!sourceUrl) {
    fail("SOURCE_DATABASE_URL / DATABASE_URL is not set — the copy tool needs the current (old) database connection.");
  }
  if (!targetUrl) {
    console.error(
      "NEW_DATABASE_URL is not set. Add the new Luceris database connection string and re-run:\n" +
        "  bun run scripts/copy-db.ts\n" +
        "(set it in Settings → Environment as NEW_DATABASE_URL, or pass it inline.)",
    );
    process.exit(1);
  }

  const opts = { ssl: "require", max: 1, connect_timeout: 15, idle_timeout: 10 } as const;
  const source = postgres(sourceUrl, opts);
  const target = postgres(targetUrl, opts);
  const sourceDb = drizzle(source, { schema });
  const targetDb = drizzle(target, { schema });

  // 1. Inventory the source (never print the URL, only what's inside it).
  console.log("📊 Source database contents:");
  const inventory: Record<string, number> = {};
  for (const [table, tableSchema] of TABLES) {
    try {
      const [row] = await sourceDb.select({ n: count() }).from(tableSchema);
      inventory[table] = row?.n ?? 0;
      console.log(`  • ${table}: ${inventory[table]} rows`);
    } catch (error) {
      inventory[table] = -1;
      console.log(`  • ${table}: ❌ missing/unreadable (${error instanceof Error ? error.message : error})`);
    }
  }

  // 2. Migrate the target schema (same bootstrap the Vercel build runs).
  console.log("\n🛠  Migrating target database schema…");
  await ensureSchemaWith(targetDb);
  console.log("  ✅ Target schema up to date");

  // 3. Never copy into a database that already has data.
  const [existingUsers] = await targetDb.select({ n: count() }).from(schema.users);
  if ((existingUsers?.n ?? 0) > 0) {
    fail("Target database already has users — aborting to avoid duplicates. Point NEW_DATABASE_URL at a truly empty database.");
  }

  // 4. Copy each table.
  const failures: { table: string; id: unknown; error: string }[] = [];
  console.log("\n📦 Copying data…");

  const insertChunk = async (tableName: string, tableSchema: any, rows: any[]): Promise<void> => {
    for (let i = 0; i < rows.length; i += BATCH) {
      const chunk = rows.slice(i, i + BATCH);
      try {
        await targetDb.insert(tableSchema).values(chunk);
      } catch (batchError) {
        // Fall back row-by-row so one incompatible row never loses the table.
        for (const row of chunk) {
          try {
            await targetDb.insert(tableSchema).values([row]);
          } catch (rowError) {
            const id = row?.id;
            const message = rowError instanceof Error ? rowError.message : String(rowError);
            failures.push({ table: tableName, id: id ?? "(no id)", error: message.slice(0, 300) });
          }
        }
      }
    }
  };

  for (const [tableName, tableSchema] of TABLES) {
    if (inventory[tableName] === undefined || inventory[tableName] < 0 || inventory[tableName] === 0) continue;

    const rows: any[] = await sourceDb.select().from(tableSchema);

    if (tableName === "categories") {
      // Insert topologically: keep inserting rows whose parent is already in
      // (or null) until nothing is left; leftovers are orphans/cycles.
      const remaining = [...rows];
      const copiedIds = new Set<string>();
      while (remaining.length > 0) {
        const ready = remaining.filter(
          (r) => r.parentId === null || r.parentId === undefined || copiedIds.has(r.parentId),
        );
        if (ready.length === 0) break; // orphans/cycles — reported below
        const readyIds = new Set<string>(ready.map((r) => r.id));
        await insertChunk(tableName, tableSchema, ready);
        readyIds.forEach((id) => copiedIds.add(id));
        for (const id of readyIds) {
          const idx = remaining.findIndex((r) => r.id === id);
          if (idx !== -1) remaining.splice(idx, 1);
        }
      }
      for (const orphan of remaining) {
        failures.push({ table: tableName, id: orphan.id, error: "parent category missing on source" });
      }
      console.log(`  ✅ categories: ${rows.length} rows`);
      continue;
    }

    await insertChunk(tableName, tableSchema, rows);
    console.log(`  ✅ ${tableName}: ${rows.length} rows`);
  }

  const copiedTotal = Object.entries(inventory)
    .filter(([, n]) => n > 0)
    .reduce((sum, [, n]) => sum + n, 0);
  console.log(`\n🎉 Copied ${copiedTotal} rows across ${TABLES.length} tables.`);

  if (failures.length > 0) {
    console.warn(`\n⚠ ${failures.length} row(s) could not be copied:`);
    for (const f of failures.slice(0, 25)) {
      console.warn(`  • ${f.table} id=${JSON.stringify(f.id)}: ${f.error}`);
    }
    process.exit(1);
  }

  process.exit(0);
}

main().catch((error) => {
  console.error("\n❌ Copy failed:", error instanceof Error ? error.message : error);
  process.exit(1);
});
