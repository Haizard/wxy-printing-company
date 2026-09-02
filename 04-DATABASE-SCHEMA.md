# Database Schema

PostgreSQL. All money = `integer` (TZS, no cents). All timestamps `timestamptz`. All ids `uuid` unless noted.

## 1. Identity
```sql
users (
  id uuid pk,
  full_name text not null,
  email text unique,
  phone text unique,
  password_hash text,
  role text check (role in ('customer','sales','production','inventory_manager','admin')) not null default 'customer',
  avatar_url text,
  created_at timestamptz default now(),
  is_active boolean default true
)
```

## 2. Catalog
```sql
categories (
  id uuid pk,
  parent_id uuid references categories(id),   -- null = top-level
  name text not null,
  slug text unique not null,
  icon text,                                   -- SF-Symbol-style name for iOS UI
  sort_order int default 0,
  internal_only boolean default false          -- e.g. calendar cost tables
)

products (
  id uuid pk,
  category_id uuid references categories(id) not null,
  name text not null,
  slug text unique not null,
  description text,
  images text[],
  pricing_model text not null,                 -- see doc 08 for enum values
  base_unit text,                               -- 'sqm','sheet','piece','stitch','cm2','page','leaf-set'
  min_order_qty int default 1,
  lead_time_days int,
  is_active boolean default true,
  is_shop_visible boolean default true,         -- appears in web shop
  created_at timestamptz default now()
)

product_options (                               -- e.g. material, GSM, side count, finish
  id uuid pk,
  product_id uuid references products(id),
  option_key text not null,                     -- 'material','gsm','sides','size_variant'
  option_label text not null,
  input_type text check (input_type in ('select','number','dimension','boolean')) not null,
  is_required boolean default true,
  sort_order int default 0
)

product_option_values (
  id uuid pk,
  product_option_id uuid references product_options(id),
  value_key text not null,                      -- '150gsm', 'broad_base', 'a3'
  value_label text not null,
  sort_order int default 0
)
```

## 3. Pricing engine tables
```sql
price_rules (
  id uuid pk,
  product_id uuid references products(id) not null,
  pricing_model text not null,                  -- redundant cache of products.pricing_model, for fast lookup
  option_filter jsonb default '{}',              -- e.g. {"material":"acrylic_6mm"} narrows which bands apply
  markup_percent numeric,                        -- used by sheet_qty_tier_markup / percentage_markup_on_material
  min_charge integer,                             -- e.g. "less than 1 sqm" flat charge
  currency text default 'TZS',
  is_internal_cost boolean default false,         -- true = cost table, never shown to customer
  active_from date default current_date,
  active_to date,
  created_by uuid references users(id),
  created_at timestamptz default now()
)

price_bands (
  id uuid pk,
  price_rule_id uuid references price_rules(id) not null,
  qty_min integer,                                -- null = no lower bound
  qty_max integer,                                -- null = no upper bound (this is the top/open band)
  area_min numeric,                                -- for area/coverage-based models (sqm or %)
  area_max numeric,
  unit_price_min integer not null,                 -- price per unit at this band (or lower bound of a range)
  unit_price_max integer,                           -- optional, for "24,000-29,000/sqm" style ranges
  side_count int,                                   -- 1 or 2, when relevant
  leaf_count int,                                   -- for calendars
  sort_order int default 0
)

finishing_options (
  id uuid pk,
  name text not null,                              -- 'Creasing','Saddle stitch','Lamination'
  unit text not null,                               -- 'per_piece','per_sheet','per_a3_side'
  price integer not null
)

product_finishing_options (                        -- which finishes apply to which product
  product_id uuid references products(id),
  finishing_option_id uuid references finishing_options(id),
  primary key (product_id, finishing_option_id)
)
```

## 4. Quotes / Orders
```sql
quotes (
  id uuid pk,
  quote_number text unique not null,               -- Q-2026-0001
  customer_id uuid references users(id),
  created_by uuid references users(id),             -- staff who built it, null if self-serve
  status text check (status in ('draft','sent','accepted','expired','converted')) default 'draft',
  expires_at timestamptz,
  subtotal integer not null default 0,
  total integer not null default 0,
  notes text,
  created_at timestamptz default now()
)

quote_lines (
  id uuid pk,
  quote_id uuid references quotes(id) not null,
  product_id uuid references products(id) not null,
  input_spec jsonb not null,                        -- {"width_cm":150,"height_cm":80,"qty":5,"material":"eco_solvent_banner"}
  matched_price_rule_id uuid references price_rules(id),
  matched_band_id uuid references price_bands(id),
  computed_unit_price integer not null,
  quantity integer not null default 1,
  finishing_total integer default 0,
  line_total integer not null,
  is_manual_override boolean default false,
  override_reason text,
  overridden_by uuid references users(id)
)

quote_line_finishing (
  quote_line_id uuid references quote_lines(id),
  finishing_option_id uuid references finishing_options(id),
  quantity integer default 1,
  primary key (quote_line_id, finishing_option_id)
)

orders (
  id uuid pk,
  order_number text unique not null,
  quote_id uuid references quotes(id),
  customer_id uuid references users(id) not null,
  status text check (status in ('pending','paid','partially_paid','cancelled')) default 'pending',
  total integer not null,
  payment_method text,                              -- 'cash','invoice','mobile_money' (MVP: manual)
  created_at timestamptz default now()
)
```

## 5. Jobs (production/kanban)
```sql
jobs (
  id uuid pk,
  job_number text unique not null,
  order_id uuid references orders(id),
  title text not null,
  status text check (status in
    ('quote','confirmed','in_production','qa','ready','delivered','closed')) default 'confirmed',
  assigned_to uuid references users(id),
  priority text check (priority in ('low','normal','high','urgent')) default 'normal',
  due_date date,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
)

job_status_history (
  id uuid pk,
  job_id uuid references jobs(id),
  from_status text,
  to_status text not null,
  changed_by uuid references users(id),
  changed_at timestamptz default now(),
  note text
)

job_files (
  id uuid pk,
  job_id uuid references jobs(id),
  file_url text not null,
  file_type text,                                   -- 'artwork','proof','mockup'
  uploaded_by uuid references users(id),
  uploaded_at timestamptz default now()
)
```

## 6. Inventory
```sql
inventory_items (
  id uuid pk,
  name text not null,                               -- 'Vinyl - White Glossy (roll)'
  sku text unique,
  unit text not null,                                -- 'sqm','sheet','roll','ml','pc'
  current_qty numeric not null default 0,
  reorder_level numeric not null default 0,
  unit_cost integer,
  supplier text,
  linked_product_option_value_id uuid references product_option_values(id) -- optional link to catalog material
)

inventory_movements (
  id uuid pk,
  item_id uuid references inventory_items(id) not null,
  job_id uuid references jobs(id),
  movement_type text check (movement_type in ('in','out','adjustment')) not null,
  quantity numeric not null,
  reason text,
  created_by uuid references users(id),
  created_at timestamptz default now()
)
```

## 7. Chat
```sql
chat_threads (
  id uuid pk,
  job_id uuid references jobs(id),
  quote_id uuid references quotes(id),
  is_internal boolean default false,                 -- staff-only thread
  created_at timestamptz default now()
)

chat_messages (
  id uuid pk,
  thread_id uuid references chat_threads(id) not null,
  sender_id uuid references users(id) not null,
  body text,
  attachment_url text,
  created_at timestamptz default now(),
  read_by uuid[] default '{}'
)
```

## 8. Indexing notes
- `products(category_id)`, `products(pricing_model)`
- `price_bands(price_rule_id, qty_min, qty_max)`
- `quotes(customer_id, status)`, `jobs(status, assigned_to)`
- `chat_messages(thread_id, created_at)`
- GIN index on `price_rules.option_filter` and `quote_lines.input_spec` (jsonb) for filtering.
