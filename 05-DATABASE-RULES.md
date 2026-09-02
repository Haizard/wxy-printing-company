# Database Rules & Integrity Constraints

## 1. Pricing data governance
1. **Pricing is never hardcoded in application code.** All prices live in `price_rules` + `price_bands`. Code only interprets `pricing_model` and resolves the matching row(s).
2. `price_rules.is_internal_cost = true` rows (e.g. calendar "cost, not price" tables, offset supplier-cost columns) must **never** be returned to a `customer` role, in any API response, under any circumstance. Enforce at the query layer (a view `price_rules_customer_safe` that filters `is_internal_cost = false`), not just in the UI.
3. Every price change is versioned: don't `UPDATE` a `price_bands` row in place for a live catalog change — insert a new `price_rules` row with `active_from = today` and set the previous row's `active_to = today - 1`. This keeps historical quotes reproducible/auditable.
4. A `price_bands` band's `[qty_min, qty_max]` ranges for the same `price_rule_id` must not overlap and must not have gaps larger than 1 unit (enforced by a seed-time validation script, not a DB constraint, since Postgres range-exclusion constraints on nullable bounds are awkward — validate in the migration/seed tooling instead).
5. Ranges expressed as "X - Y" in the source PDFs (e.g. "24,000-29,000/sqm") populate both `unit_price_min` and `unit_price_max`. The calculator engine must always show the **range** to staff and require an explicit price pick (or apply a configurable default, e.g. midpoint) — never silently guess.

## 2. Referential integrity
- `ON DELETE RESTRICT` on any FK from `quote_lines`, `orders`, `jobs` back to `products`/`price_rules` — a product or price rule that has been used in a real quote/order can be deactivated (`is_active = false`) but never hard-deleted.
- `ON DELETE CASCADE` only for genuinely dependent child rows: `chat_messages` → `chat_threads`, `product_options` → `product_option_values`, `price_bands` → `price_rules`.
- `categories.parent_id` self-reference must be validated against cycles at the application layer before insert/update (simple ancestor-walk check).

## 3. Money & units
- All currency columns are `integer` TZS. No `numeric`/`float` for money — matches the source data (whole-number TZS) and avoids rounding drift.
- `area_min`/`area_max`/`quantity` fields that represent physical measurements (sqm, cm, stitches, cm²) use `numeric` to allow fractional sqm (e.g. 1.35 sqm banner).
- All dimension inputs from the UI are captured in **cm** and converted server-side to **m²** (`(width_cm/100) * (height_cm/100)`) before matching against `area_based_range` bands, so the stored `input_spec` always has both the raw cm values (for display/production) and the derived sqm (for pricing).

## 4. Status/state machine rules
- `jobs.status` transitions are constrained to a fixed forward graph (`quote → confirmed → in_production → qa → ready → delivered → closed`), with an explicit `cancelled`/`on_hold` side-state allowed from any non-closed status. Enforce via an application-layer state machine, log every transition in `job_status_history`.
- A `quotes.status` of `expired` is set by a scheduled job when `now() > expires_at` and status is still `sent`. Expired quotes cannot convert to orders without staff re-approval (creates a new quote referencing the old one).

## 5. Inventory rules
- `inventory_items.current_qty` must never go negative; a stock-out movement that would push it below zero is rejected at the application layer with a "backorder" flag surfaced to Inventory Manager, not silently allowed.
- Every `inventory_movements` row is immutable once created (append-only ledger). Corrections are made via a new `adjustment` movement, never an `UPDATE`/`DELETE` of a past movement.
- `reorder_level` breach triggers a dashboard flag; it does not auto-create a purchase order in MVP.

## 6. Chat rules
- A `chat_threads.is_internal = true` thread is only ever created/read by staff roles; the API must reject any request from a `customer` role role touching an internal thread, at the query layer (not just hidden in UI).
- Attachments reuse the same file-storage bucket/policy as `job_files`; both are subject to a max-size and allowed-mimetype check server-side.

## 7. Audit fields
- Every table involved in pricing or money (`price_rules`, `quotes`, `quote_lines`, `orders`) carries `created_by`/`created_at`, and `quote_lines.is_manual_override` rows require a non-null `override_reason` and `overridden_by` — enforced with a `CHECK` constraint plus application validation.

## 8. Seeding rule
- The seed scripts in `infra/db/seed/` must load the **entire** taxonomy from `03-PRODUCT-TAXONOMY.md` and every numeric price/range found in the two source PDFs, tagging offset/calendar internal cost tables with `is_internal_cost = true`. No product ships to the live catalog without a corresponding `price_rules` + `price_bands` entry — a product with `pricing_model` set but zero matching `price_bands` should fail a pre-deploy seed-integrity check.
