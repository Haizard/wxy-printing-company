# PrintHub OS — Project Overview

## 1. What this is
A single web platform for a full-service printing company (digital/HP Indigo, offset, large-format solvent/eco-solvent, flat-bed rigid media, signage, apparel/promo branding, and design services). It replaces spreadsheets and WhatsApp quoting with one system that covers:

1. **Product Catalog** — categorized/sub-categorized products & services (derived from `WXY_PRICE_LIST_CATALOGUE.pdf` and `pg_1.pdf`).
2. **Price Calculator Engine** — a rules-driven quoting engine. Staff (or eventually customers) describe a job in plain terms (material, size in cm/m², quantity, sides, finishing) and the engine resolves the correct price-band/formula and returns a price + breakdown.
3. **Inventory Management** — stock of paper, vinyl, acrylic sheets, ink, consumables; stock movement tied to jobs.
4. **Web Shop** — catalog browsing + cart + checkout for standard/fixed-price items (business cards, flyers, mugs, keychains, etc.).
5. **Project/Job Management** — kanban-style job lifecycle: Quote → Approved → In Production → QA → Ready → Delivered.
6. **Chat** — in-app messaging between customer ↔ staff on a job/quote thread, plus an internal staff chat.

## 2. Source data
- `pg_1.pdf` — internal costing sheet: HP Indigo digital press pricing (by paper type/GSM & quantity band), Xerox coverage-based pricing, offset A1–A3 posters, calendar cost sheets, flat-bed rigid media (acrylic/forex/corex/ABS), solvent/eco-solvent per-sqm pricing (banners, vinyl, flags), wheel covers, photo printing, keychains, mugs, signage engraving/cutting procedure, design service flat fees.
- `WXY_PRICE_LIST_CATALOGUE.pdf` — customer-facing catalog: logo packages, brochures, flyers, business cards, canvas+frame, photo-on-wood, ID cards, door signs, bottle printing, engraved chain, pen/cap printing, table/wall calendars, photo books, diaries, notebooks, company profiles, product catalogues, umbrellas, A-stands, roll-up/tear-drop/telescopic/blade banners, indoor 2D signage, non-woven bags, wheel covers, name tags, customised clocks.

These two documents are the seed data for `07-PRODUCT-TAXONOMY.md` and the pricing rules in `08-PRICE-CALCULATOR-ENGINE.md`. All TZS figures currently in the PDFs become the initial seed rows in the `price_rules` / `price_bands` tables — not hardcoded logic.

## 3. Core design principle
**Pricing is data, not code.** Every category has a `pricing_model` type (see engine doc) and a set of `price_bands`/`price_rules` rows. Adding a new product or repricing an existing one must never require a code deploy — only a database/admin-panel change.

## 4. Users & Roles
| Role | Access |
|---|---|
| Customer | Browse shop, request quotes, chat, track own jobs, pay/checkout |
| Sales/Front Desk | Full price calculator, create quotes/orders, chat with customers |
| Production Staff | View job queue, update job status, consume inventory |
| Inventory Manager | Manage stock, suppliers, reorder points |
| Admin/Director | Manage catalog, pricing rules, users, reports, approve high-discount quotes |

## 5. Document set
- `01-MVP-SCOPE.md`
- `02-PROJECT-STRUCTURE.md`
- `03-DATABASE-SCHEMA.md`
- `04-DATABASE-RULES.md`
- `05-UI-DESIGN-SYSTEM.md`
- `06-UI-STRUCTURE.md`
- `07-PRODUCT-TAXONOMY.md`
- `08-PRICE-CALCULATOR-ENGINE.md`
