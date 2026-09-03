import { db } from "./index";
import { sql, type SQL } from "drizzle-orm";

// ─────────────────────────────────────────────────────────────────────────────
// Boot-time schema bootstrap ("auto migration of tables").
//
// Runs on every server start (local dev, sandbox preview and Vercel function
// cold starts). Every statement is idempotent — CREATE IF NOT EXISTS, DO-block
// enum creation, and ALTER … ADD COLUMN IF NOT EXISTS — so it is safe to run
// repeatedly and will bring a brand-new empty database up to the full schema
// the app expects. Mirrors src/db/schema.ts (source of truth for types).
// ─────────────────────────────────────────────────────────────────────────────

const ENUM_DDL: Array<[type: string, values: string[]]> = [
  ["user_role", ["customer", "sales", "production", "inventory_manager", "admin"]],
  ["quote_status", ["draft", "sent", "accepted", "expired", "converted"]],
  ["job_status", ["quote", "confirmed", "in_production", "qa", "ready", "delivered", "closed"]],
  ["job_priority", ["low", "normal", "high", "urgent"]],
  ["order_status", ["pending", "paid", "partially_paid", "cancelled"]],
  ["movement_type", ["in", "out", "adjustment"]],
];

const TABLE_DDL: string[] = [
  `CREATE TABLE IF NOT EXISTS users (
    id uuid primary key default gen_random_uuid(),
    full_name text not null,
    email text,
    phone text,
    password_hash text,
    role user_role not null default 'customer',
    avatar_url text,
    created_at timestamp default now(),
    is_active boolean default true
  )`,

  `CREATE TABLE IF NOT EXISTS categories (
    id uuid primary key default gen_random_uuid(),
    parent_id uuid references categories(id),
    name text not null,
    slug text not null,
    icon text,
    sort_order integer default 0,
    internal_only boolean default false
  )`,

  `CREATE TABLE IF NOT EXISTS products (
    id uuid primary key default gen_random_uuid(),
    category_id uuid not null references categories(id),
    name text not null,
    slug text not null,
    description text,
    images text[],
    pricing_model text not null,
    base_unit text,
    min_order_qty integer default 1,
    lead_time_days integer,
    is_active boolean default true,
    is_shop_visible boolean default true,
    created_at timestamp default now()
  )`,

  `CREATE TABLE IF NOT EXISTS product_options (
    id uuid primary key default gen_random_uuid(),
    product_id uuid not null references products(id),
    option_key text not null,
    option_label text not null,
    input_type text not null,
    is_required boolean default true,
    sort_order integer default 0
  )`,

  `CREATE TABLE IF NOT EXISTS product_option_values (
    id uuid primary key default gen_random_uuid(),
    product_option_id uuid not null references product_options(id),
    value_key text not null,
    value_label text not null,
    sort_order integer default 0
  )`,

  `CREATE TABLE IF NOT EXISTS price_rules (
    id uuid primary key default gen_random_uuid(),
    product_id uuid not null references products(id),
    pricing_model text not null,
    option_filter jsonb default '{}'::jsonb,
    markup_percent numeric,
    min_charge integer,
    currency text default 'TZS',
    is_internal_cost boolean default false,
    active_from date default now(),
    active_to date,
    created_by uuid references users(id),
    created_at timestamp default now()
  )`,

  `CREATE TABLE IF NOT EXISTS price_bands (
    id uuid primary key default gen_random_uuid(),
    price_rule_id uuid not null references price_rules(id),
    qty_min integer,
    qty_max integer,
    area_min numeric,
    area_max numeric,
    unit_price_min integer not null,
    unit_price_max integer,
    side_count integer,
    leaf_count integer,
    sort_order integer default 0
  )`,

  `CREATE TABLE IF NOT EXISTS finishing_options (
    id uuid primary key default gen_random_uuid(),
    name text not null,
    unit text not null,
    price integer not null
  )`,

  `CREATE TABLE IF NOT EXISTS product_finishing_options (
    product_id uuid not null references products(id),
    finishing_option_id uuid not null references finishing_options(id),
    primary key (product_id, finishing_option_id)
  )`,

  `CREATE TABLE IF NOT EXISTS quotes (
    id uuid primary key default gen_random_uuid(),
    quote_number text not null,
    customer_id uuid not null references users(id),
    created_by uuid references users(id),
    status quote_status default 'draft',
    expires_at timestamp,
    subtotal integer not null default 0,
    total integer not null default 0,
    notes text,
    created_at timestamp default now()
  )`,

  `CREATE TABLE IF NOT EXISTS quote_lines (
    id uuid primary key default gen_random_uuid(),
    quote_id uuid not null references quotes(id),
    product_id uuid not null references products(id),
    input_spec jsonb not null,
    matched_price_rule_id uuid references price_rules(id),
    matched_band_id uuid references price_bands(id),
    computed_unit_price integer not null,
    quantity integer not null default 1,
    finishing_total integer default 0,
    line_total integer not null,
    is_manual_override boolean default false,
    override_reason text,
    overridden_by uuid references users(id)
  )`,

  `CREATE TABLE IF NOT EXISTS orders (
    id uuid primary key default gen_random_uuid(),
    order_number text not null,
    quote_id uuid references quotes(id),
    customer_id uuid not null references users(id),
    status order_status default 'pending',
    total integer not null,
    payment_method text,
    items jsonb default '[]'::jsonb,
    notes text,
    created_at timestamp default now()
  )`,

  `CREATE TABLE IF NOT EXISTS jobs (
    id uuid primary key default gen_random_uuid(),
    job_number text not null,
    order_id uuid references orders(id),
    title text not null,
    status job_status default 'confirmed',
    assigned_to uuid references users(id),
    priority job_priority default 'normal',
    due_date date,
    created_at timestamp default now(),
    updated_at timestamp default now()
  )`,

  `CREATE TABLE IF NOT EXISTS job_status_history (
    id uuid primary key default gen_random_uuid(),
    job_id uuid not null references jobs(id),
    from_status text,
    to_status text not null,
    changed_by uuid not null references users(id),
    changed_at timestamp default now(),
    note text
  )`,

  `CREATE TABLE IF NOT EXISTS job_files (
    id uuid primary key default gen_random_uuid(),
    job_id uuid not null references jobs(id),
    file_url text not null,
    file_type text,
    uploaded_by uuid not null references users(id),
    uploaded_at timestamp default now()
  )`,

  `CREATE TABLE IF NOT EXISTS inventory_items (
    id uuid primary key default gen_random_uuid(),
    name text not null,
    sku text,
    unit text not null,
    current_qty numeric not null default '0',
    reorder_level numeric not null default '0',
    unit_cost integer,
    supplier text,
    linked_product_option_value_id uuid
  )`,

  `CREATE TABLE IF NOT EXISTS inventory_movements (
    id uuid primary key default gen_random_uuid(),
    item_id uuid not null references inventory_items(id),
    job_id uuid references jobs(id),
    movement_type movement_type not null,
    quantity numeric not null,
    reason text,
    created_by uuid not null references users(id),
    created_at timestamp default now()
  )`,

  `CREATE TABLE IF NOT EXISTS chat_threads (
    id uuid primary key default gen_random_uuid(),
    job_id uuid references jobs(id),
    quote_id uuid references quotes(id),
    customer_id uuid references users(id),
    is_internal boolean default false,
    created_at timestamp default now()
  )`,

  `CREATE TABLE IF NOT EXISTS chat_messages (
    id uuid primary key default gen_random_uuid(),
    thread_id uuid not null references chat_threads(id),
    sender_id uuid not null references users(id),
    body text,
    attachment_url text,
    created_at timestamp default now(),
    read_by uuid[] default '{}'::uuid[]
  )`,

  `CREATE TABLE IF NOT EXISTS contact_messages (
    id uuid primary key default gen_random_uuid(),
    name text not null,
    email text not null,
    phone text,
    subject text not null,
    message text not null,
    status text not null default 'new',
    created_at timestamp default now()
  )`,
];

const INDEX_DDL: string[] = [
  "CREATE UNIQUE INDEX IF NOT EXISTS users_email_idx ON users(email)",
  "CREATE UNIQUE INDEX IF NOT EXISTS users_phone_idx ON users(phone)",
  "CREATE UNIQUE INDEX IF NOT EXISTS categories_slug_idx ON categories(slug)",
  "CREATE INDEX IF NOT EXISTS categories_parent_idx ON categories(parent_id)",
  "CREATE UNIQUE INDEX IF NOT EXISTS products_slug_idx ON products(slug)",
  "CREATE INDEX IF NOT EXISTS products_category_idx ON products(category_id)",
  "CREATE INDEX IF NOT EXISTS products_pricing_model_idx ON products(pricing_model)",
  "CREATE INDEX IF NOT EXISTS product_options_product_idx ON product_options(product_id)",
  "CREATE INDEX IF NOT EXISTS product_option_values_option_idx ON product_option_values(product_option_id)",
  "CREATE INDEX IF NOT EXISTS price_rules_product_idx ON price_rules(product_id)",
  "CREATE INDEX IF NOT EXISTS price_rules_active_idx ON price_rules(active_from, active_to)",
  "CREATE INDEX IF NOT EXISTS price_bands_rule_idx ON price_bands(price_rule_id)",
  "CREATE INDEX IF NOT EXISTS product_finishing_options_product_idx ON product_finishing_options(product_id)",
  "CREATE INDEX IF NOT EXISTS quotes_customer_idx ON quotes(customer_id)",
  "CREATE INDEX IF NOT EXISTS quotes_status_idx ON quotes(status)",
  "CREATE INDEX IF NOT EXISTS quote_lines_quote_idx ON quote_lines(quote_id)",
  "CREATE INDEX IF NOT EXISTS orders_customer_idx ON orders(customer_id)",
  "CREATE INDEX IF NOT EXISTS orders_status_idx ON orders(status)",
  "CREATE INDEX IF NOT EXISTS jobs_status_idx ON jobs(status)",
  "CREATE INDEX IF NOT EXISTS jobs_assignee_idx ON jobs(assigned_to)",
  "CREATE INDEX IF NOT EXISTS job_status_history_job_idx ON job_status_history(job_id)",
  "CREATE INDEX IF NOT EXISTS job_files_job_idx ON job_files(job_id)",
  "CREATE UNIQUE INDEX IF NOT EXISTS inventory_items_sku_idx ON inventory_items(sku)",
  "CREATE INDEX IF NOT EXISTS inventory_movements_item_idx ON inventory_movements(item_id)",
  "CREATE INDEX IF NOT EXISTS chat_threads_job_idx ON chat_threads(job_id)",
  "CREATE INDEX IF NOT EXISTS chat_messages_thread_idx ON chat_messages(thread_id)",
];

// Columns added after the original push that older databases may lack.
const ALTER_DDL: string[] = [
  "ALTER TABLE orders ADD COLUMN IF NOT EXISTS items jsonb DEFAULT '[]'::jsonb",
  "ALTER TABLE orders ADD COLUMN IF NOT EXISTS notes text",
  "ALTER TABLE chat_threads ADD COLUMN IF NOT EXISTS customer_id uuid REFERENCES users(id)",
];

type SchemaExecutor = {
  execute: (query: SQL) => Promise<unknown>;
};

/**
 * Apply the full idempotent schema to the given executor (a drizzle database
 * instance). Used by the default DB (ensureSchema) and by the data-copy tool
 * so a brand-new target database is migrated before rows are copied in.
 */
export async function ensureSchemaWith(executor: SchemaExecutor): Promise<void> {
  // Enums first (Postgres has no CREATE TYPE IF NOT EXISTS).
  for (const [type, values] of ENUM_DDL) {
    const valueList = values.map((v) => `'${v}'`).join(", ");
    await executor.execute(
      sql.raw(
        `DO $$ BEGIN CREATE TYPE ${type} AS ENUM (${valueList}); ` +
          `EXCEPTION WHEN duplicate_object THEN NULL; END $$;`,
      ),
    );
  }

  // Tables (parents before children so FKs resolve on a fresh database).
  for (const stmt of TABLE_DDL) {
    await executor.execute(sql.raw(stmt));
  }

  // Indexes (uniqueness comes from these, matching schema.ts exactly).
  for (const stmt of INDEX_DDL) {
    await executor.execute(sql.raw(stmt));
  }

  // Additive columns for databases created before these columns existed.
  for (const stmt of ALTER_DDL) {
    await executor.execute(sql.raw(stmt));
  }
}

export async function ensureSchema(): Promise<void> {
  await ensureSchemaWith(db);
  console.log("[wxy-api] schema up to date (auto-migration complete)");
}
