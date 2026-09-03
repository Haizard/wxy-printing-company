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
  ["movement_type", ["in", "out", "waste", "return", "adjustment", "issue", "return_to_stock"]],
  ["purchase_order_status", ["draft", "ordered", "received", "cancelled"]],
  ["material_issuance_status", ["issued", "partial_return", "returned", "consumed"]],
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
    option_filter jsonb default '{}',
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
    finishing_option_id uuid not null references finishing_options(id)
  )`,

  `CREATE TABLE IF NOT EXISTS quotes (
    id uuid primary key default gen_random_uuid(),
    quote_number text unique not null,
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
    order_number text unique not null,
    quote_id uuid references quotes(id),
    customer_id uuid not null references users(id),
    status order_status default 'pending',
    total integer not null,
    payment_method text,
    items jsonb default '[]',
    notes text,
    created_at timestamp default now()
  )`,

  `CREATE TABLE IF NOT EXISTS jobs (
    id uuid primary key default gen_random_uuid(),
    job_number text unique not null,
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
    sku text unique,
    unit text not null,
    category text default 'general',
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
    waste_reason text,
    approved_by uuid references users(id),
    created_by uuid not null references users(id),
    created_at timestamp default now()
  )`,

  `CREATE TABLE IF NOT EXISTS suppliers (
    id uuid primary key default gen_random_uuid(),
    name text not null,
    contact_person text,
    email text,
    phone text,
    address text,
    notes text,
    is_active boolean default true,
    created_at timestamp default now()
  )`,

  `CREATE TABLE IF NOT EXISTS purchase_orders (
    id uuid primary key default gen_random_uuid(),
    order_number text unique not null,
    supplier_id uuid not null references suppliers(id),
    status purchase_order_status default 'draft',
    total_amount integer default 0,
    notes text,
    expected_date date,
    received_date date,
    created_by uuid not null references users(id),
    created_at timestamp default now()
  )`,

  `CREATE TABLE IF NOT EXISTS purchase_order_items (
    id uuid primary key default gen_random_uuid(),
    purchase_order_id uuid not null references purchase_orders(id),
    inventory_item_id uuid not null references inventory_items(id),
    quantity numeric not null,
    unit_cost integer not null,
    total_cost integer not null
  )`,

  `CREATE TABLE IF NOT EXISTS material_issuances (
    id uuid primary key default gen_random_uuid(),
    job_id uuid not null references jobs(id),
    inventory_item_id uuid not null references inventory_items(id),
    quantity_issued numeric not null,
    quantity_used numeric default '0',
    quantity_returned numeric default '0',
    quantity_waste numeric default '0',
    waste_reason text,
    status material_issuance_status default 'issued',
    issued_by uuid not null references users(id),
    issued_at timestamp default now(),
    returned_at timestamp,
    notes text
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
    read_by text[] default '{}'
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

// ── Additive columns (safe ALTER TABLE … ADD COLUMN IF NOT EXISTS) ──────────
//
// When a new column is added to schema.ts, add the corresponding ALTER here.
// The IF NOT EXISTS guard means it is a no-op when the column already exists.

const ADDITIVE_COLUMNS: string[] = [
  // inventory_items: category column
  `DO $$ BEGIN ALTER TABLE inventory_items ADD COLUMN IF NOT EXISTS category text DEFAULT 'general'; EXCEPTION WHEN duplicate_column THEN null; END $$`,

  // inventory_movements: waste_reason column
  `DO $$ BEGIN ALTER TABLE inventory_movements ADD COLUMN IF NOT EXISTS waste_reason text; EXCEPTION WHEN duplicate_column THEN null; END $$`,

  // inventory_movements: approved_by column
  `DO $$ BEGIN ALTER TABLE inventory_movements ADD COLUMN IF NOT EXISTS approved_by uuid REFERENCES users(id); EXCEPTION WHEN duplicate_column THEN null; END $$`,
];

// ── Indexes (CREATE INDEX IF NOT EXISTS) ────────────────────────────────────

const INDEXES: string[] = [
  `CREATE INDEX IF NOT EXISTS inventory_items_category_idx ON inventory_items(category)`,
  `CREATE INDEX IF NOT EXISTS inventory_movements_job_idx ON inventory_movements(job_id)`,
  `CREATE INDEX IF NOT EXISTS inventory_movements_type_idx ON inventory_movements(movement_type)`,
  `CREATE INDEX IF NOT EXISTS suppliers_name_idx ON suppliers(name)`,
  `CREATE INDEX IF NOT EXISTS purchase_orders_supplier_idx ON purchase_orders(supplier_id)`,
  `CREATE INDEX IF NOT EXISTS purchase_orders_status_idx ON purchase_orders(status)`,
  `CREATE INDEX IF NOT EXISTS purchase_order_items_order_idx ON purchase_order_items(purchase_order_id)`,
  `CREATE INDEX IF NOT EXISTS material_issuances_job_idx ON material_issuances(job_id)`,
  `CREATE INDEX IF NOT EXISTS material_issuances_item_idx ON material_issuances(inventory_item_id)`,
  `CREATE INDEX IF NOT EXISTS material_issuances_status_idx ON material_issuances(status)`,
  `CREATE INDEX IF NOT EXISTS contact_messages_status_idx ON contact_messages(status)`,
  `CREATE INDEX IF NOT EXISTS price_rules_active_idx ON price_rules(active_from, active_to)`,
  `CREATE INDEX IF NOT EXISTS categories_parent_idx ON categories(parent_id)`,
  `CREATE INDEX IF NOT EXISTS products_category_idx ON products(category_id)`,
  `CREATE INDEX IF NOT EXISTS products_pricing_model_idx ON products(pricing_model)`,
  `CREATE INDEX IF NOT EXISTS price_rules_product_idx ON price_rules(product_id)`,
  `CREATE INDEX IF NOT EXISTS price_bands_rule_idx ON price_bands(price_rule_id)`,
  `CREATE INDEX IF NOT EXISTS product_options_product_idx ON product_options(product_id)`,
  `CREATE INDEX IF NOT EXISTS product_option_values_option_idx ON product_option_values(product_option_id)`,
  `CREATE INDEX IF NOT EXISTS product_finishing_options_product_idx ON product_finishing_options(product_id)`,
  `CREATE INDEX IF NOT EXISTS quotes_customer_idx ON quotes(customer_id)`,
  `CREATE INDEX IF NOT EXISTS quotes_status_idx ON quotes(status)`,
  `CREATE INDEX IF NOT EXISTS quote_lines_quote_idx ON quote_lines(quote_id)`,
  `CREATE INDEX IF NOT EXISTS orders_customer_idx ON orders(customer_id)`,
  `CREATE INDEX IF NOT EXISTS orders_status_idx ON orders(status)`,
  `CREATE INDEX IF NOT EXISTS jobs_status_idx ON jobs(status)`,
  `CREATE INDEX IF NOT EXISTS jobs_assignee_idx ON jobs(assigned_to)`,
  `CREATE INDEX IF NOT EXISTS job_status_history_job_idx ON job_status_history(job_id)`,
  `CREATE INDEX IF NOT EXISTS job_files_job_idx ON job_files(job_id)`,
  `CREATE INDEX IF NOT EXISTS chat_threads_job_idx ON chat_threads(job_id)`,
  `CREATE INDEX IF NOT EXISTS chat_messages_thread_idx ON chat_messages(thread_id)`,
];

// ── Execute ─────────────────────────────────────────────────────────────────

async function runDDL(label: string, statements: string[]) {
  for (const stmt of statements) {
    try {
      await db.execute(sql.raw(stmt));
    } catch (err: any) {
      // "already exists" is expected and safe to ignore
      if (err?.message?.includes("already exists")) continue;
      console.error(`[bootstrap] ${label} error:`, err.message || err);
    }
  }
}

export async function ensureSchemaWith(targetDb: any) {
  // Use the raw sql from drizzle-orm for raw DDL execution
  const { sql: rawSql } = await import("drizzle-orm");

  // 1. Enums
  for (const [type, values] of ENUM_DDL) {
    try {
      const createEnum = rawSql.raw(
        `DO $$ BEGIN
          CREATE TYPE ${type} AS ENUM (${values.map((v) => `'${v}'`).join(", ")});
        EXCEPTION
          WHEN duplicate_object THEN null;
        END $$`
      );
      await targetDb.execute(createEnum);
    } catch (err: any) {
      if (err?.message?.includes("already exists")) continue;
      console.error(`[bootstrap] enum ${type} error:`, err.message || err);
    }
  }

  // 2. Tables
  for (const stmt of TABLE_DDL) {
    try {
      await targetDb.execute(rawSql.raw(stmt));
    } catch (err: any) {
      if (err?.message?.includes("already exists")) continue;
      console.error(`[bootstrap] table error:`, err.message || err);
    }
  }

  // 3. Additive columns
  for (const stmt of ADDITIVE_COLUMNS) {
    try {
      await targetDb.execute(rawSql.raw(stmt));
    } catch (err: any) {
      if (err?.message?.includes("already exists")) continue;
      console.error(`[bootstrap] column error:`, err.message || err);
    }
  }

  // 4. Indexes
  for (const stmt of INDEXES) {
    try {
      await targetDb.execute(rawSql.raw(stmt));
    } catch (err: any) {
      if (err?.message?.includes("already exists")) continue;
      console.error(`[bootstrap] index error:`, err.message || err);
    }
  }
}

export async function ensureSchema() {
  await ensureSchemaWith(db);
}
