# Price Calculator Engine

Lives in `packages/pricing-engine` (pure TS, no framework deps), called from both the API (authoritative) and the web app (live preview). Single function contract:

```ts
calculatePrice(input: {
  productId: string;
  spec: Record<string, string | number | boolean>; // e.g. {width_cm:150, height_cm:80, qty:5, material:'eco_solvent_banner', sides:1}
}) => {
  matchedRuleId: string;
  matchedBandId?: string;
  unitPrice: number;          // or unitPriceRange if the band is a range
  unitPriceRange?: [number, number];
  quantity: number;
  areaSqm?: number;
  subtotal: number;
  finishingTotal: number;
  total: number;
  breakdown: BreakdownLine[]; // human-readable line items for the "glass receipt"
  requiresStaffReview: boolean; // true for signage_engrave_cut_formula, ranges needing a pick, or manual overrides
}
```

## 1. The seven `pricing_model` types

### 1.1 `qty_band_per_unit`
Simple case: find the row in `price_bands` where `qty_min <= spec.qty <= qty_max` (or `qty_max` is null = open-ended top band) for the matching `option_filter` (e.g. GSM/paper type, single/double sided). `unit_price × qty = subtotal`.
- **Examples from source data:** HP Indigo A3 posters (100→1000), offset A2/A1/A3 posters, offset brochures, Xerox printing (combined with coverage — see 1.2), non-woven bags, metal keychains, embroidery digitization (by stitch count).

### 1.2 `coverage_qty_band`
Two-dimensional band lookup: first select the coverage tier (`0-20%`, `20-50%`, `50-100%` — stored as an `option_filter` value the user picks via a slider grouped into 3 stops), then within that tier apply `qty_band_per_unit` logic, with a `side_count` multiplier baked into the band row itself (single vs double side are separate band rows, not a ×2 multiplication, since the source pricing isn't a clean double).
- **Example:** Xerox A4 sheet printing.

### 1.3 `area_based_range`
For per-m² large-format materials.
```
area_sqm = (width_cm/100) * (height_cm/100)
if area_sqm < 1: price = price_rules.min_charge   // "Less than 1sqm" flat rate
else: price = area_sqm * unit_price   // unit_price picked from [unit_price_min, unit_price_max] range
```
Because the source data gives a **range** (e.g. "24,000-29,000"), the engine returns `unitPriceRange` and requires the staff user to pick a point in the range (default suggestion = range midpoint, editable) before the quote can be saved → `requiresStaffReview = true` unless a default-selection policy is configured per product.
- **Examples:** banners, vinyls, flags, rollup material by material type; photo printing (canvas/gloss/matte) priced per sq ft — convert sqft↔sqm at input-unit-toggle level, store canonical sqm.

### 1.4 `sheet_qty_tier_markup`
For flat-bed rigid media (acrylic/forex/corex/ABS).
```
tier = lookup by requested sheet quantity: 0–10 / 10–25 / 25–50 / 50–100 sheets
base_rate_per_sqm = tier.base_rate            // 40,000 / 30,000 / 25,000 / 20,000 per sqm at their respective markups
material_price_per_sheet = price_bands row for (material, tier)   // pre-computed sheet price seeded from pg_1.pdf table
sheet_area_sqm = standard sheet size for that material (seed data) OR custom if user enters custom cut size
price = material_price_per_sheet * requested_sheets   // when using full standard sheets
      OR (area_sqm_requested / sheet_area_sqm) * material_price_per_sheet   // when user asks for partial/custom cut
```
Also surfaces a note: *"For volume orders, check imposition (how many pieces fit per sheet) before quoting — advise the optimal size."* This is a human-guided step (a "sheets required" helper input where staff enters piece size + qty and the engine estimates sheets needed via simple grid-fit math), not fully automated nesting.
- **Examples:** Acrylic 3/4/6/8/10/12mm, Milky Acrylic, Forex 2/3/4/5mm, Corex 3/4/5mm, ABS 0.8/1/2mm.

### 1.5 `imposition_sheet_based` (book/booklet printing)
Implements the exact 4-step manual procedure from `pg_1.pdf`:
```
1. size = spec.pageSize            // a4 | a5 | dl | custom(w,h)
2. upsPerA3Sheet = lookup(size)     // a4→4, a5→8, dl→n (configurable table), custom→computed via grid-fit
3. totalPages = spec.pageCount
   sheetsPerBook = ceil(totalPages / upsPerA3Sheet / 2)   // both-sides printing halves sheet count again
   totalSheets = sheetsPerBook * spec.qty
4. a3SheetUnitPrice = qty_band_per_unit lookup on the "HP Indigo A3 sheet" product, using totalSheets as the qty
   base = a3SheetUnitPrice * totalSheets
   finishingTotal = sum(selected finishing_options: creasing/saddle-stitch/perfect-bind/hardcover/ring-wire/folding/lamination)
   total = base + finishingTotal
```
- Exposes each intermediate number (ups/sheet, sheets/book, total sheets, sheet unit price) in the breakdown so staff can sanity-check against a manual calc.

### 1.6 `signage_engrave_cut_formula`
Implements the 4-step procedure from `pg_1.pdf` ("Signage Prices/Quotation"):
```
1. sheetPrice = price_bands lookup by material (Gold/Black, Silver/Black, White/Black, Red/Black, Alucobond, Acrylic 2-10mm, Milk Acrylic, Colored Acrylic)
2. cutTimeHours = staff-entered estimate (from Signage Manager)
   cuttingCost = cutTimeHours * hourlyCuttingRate       // seeded 120,000/hr
   engravingCost = engraveTimeHours * hourlyEngravingRate // seeded 150,000/hr
3. rawCost = sheetPrice + cuttingCost + engravingCost
4. upsPerSheet = staff-entered fit estimate
   pricePerPiece = rawCost / upsPerSheet
```
This model **always** sets `requiresStaffReview = true` and routes the quote into an approval sub-workflow: Sales enters info → Signage Manager fills cut/engrave time → Director approves final number → quote sent. Modeled as a `quote.status` sub-flag (`pending_signage_calc`, `pending_director_approval`) rather than a separate table, to keep the state machine simple.

### 1.7 `flat_fixed_per_unit_band` / `flat_fixed_service_fee` / `package_tier_flat_fee` / `per_page_band` / `per_page_plus_design_fee` / `range_service_fee` / `percentage_markup_on_material` / `area_qty_band` / `qty_band_by_leaf_count`
Grouped here as "simple lookup" variants — all resolve to a direct `price_bands` row match (by qty band, leaf-count band, page-count band, or fixed value) with no derived geometry:
- `flat_fixed_per_unit_band`: business cards, ID cards, name tags, flyers, canvas+frame, photo-on-wood, door signs, bottles, umbrellas, mugs, wheel covers, keychains — price varies by a size/qty/lamination option but never by a formula.
- `flat_fixed_service_fee`: single design fee, mockups, small sign design.
- `package_tier_flat_fee`: logo design Basic/Standard/Premium/Exclusive — each tier is a `product` in its own right with a fixed price and a feature-list description (no calculator math needed, just a comparison picker UI).
- `per_page_band`: book/magazine layout design (0-25, 25-50, 50-100, 100+ pages) × per-page rate.
- `per_page_plus_design_fee`: company profile = `page_count * per_page_rate + flat_design_fee`.
- `range_service_fee`: design alteration — staff manually picks a value inside the seeded range and states complexity reason (`requiresStaffReview = true`).
- `percentage_markup_on_material`: vehicle/office branding = `material_cost * (1 + markup_percent)`, where `markup_percent >= 20%` is enforced as a minimum via a `CHECK`-style validation in the resolver, not the DB.
- `area_qty_band`: heat-transfer numbering — priced per cm² banded by quantity (11-20/20-50/50-100/100+).
- `qty_band_by_leaf_count`: calendars — band lookup keyed by **both** `qty` and `leaf_count` (6/7/12/13-leaf).

## 2. Resolution algorithm (shared core)
```
1. Load product by productId → get pricing_model + is_active check.
2. Build option_filter from spec (material, gsm, sides, size_variant, coverage_tier, etc).
3. Query price_rules WHERE product_id = :id AND option_filter @> :filter
     AND active_from <= today AND (active_to IS NULL OR active_to >= today)
     AND (is_internal_cost = false OR requester.role != 'customer')
   -> if 0 rows: throw NoMatchingRuleError (surfaced in UI as "Contact us for a custom quote")
   -> if >1 rows: pick most specific match (most option_filter keys matched) — ties are a data error, log + alert admin.
4. Dispatch to the model-specific resolver function (§1.1–1.7) using the matched price_rules row + its price_bands.
5. Apply selected finishing_options (flat additive).
6. Apply any staff manual override (logged, requires reason).
7. Return the full breakdown object.
```

## 3. "Describe your project" UX flow (how a non-technical user gets to a price)
1. **Step 1 — What do you need?** Category tiles (from taxonomy doc) with plain-language labels ("Banners & Vinyl", "Business Cards", "Signage", "Custom Sign (engraved/cut)", "Books & Booklets"...).
2. **Step 2 — Tell us the details.** The form is **generated dynamically** from that product's `product_options` rows — this is why options are data-driven (§`04-DATABASE-SCHEMA.md`), not hardcoded per category:
   - `input_type = 'dimension'` → paired Width/Height fields with cm/m toggle.
   - `input_type = 'select'` → segmented control (≤4 values) or bottom-sheet picker (>4 values), populated from `product_option_values`.
   - `input_type = 'number'` → stepper (quantity, page count, leaf count).
   - `input_type = 'boolean'` → iOS switch (e.g. "with lamination").
3. **Step 3 — Live price.** As required fields fill in, the client calls the same `calculatePrice` function (via API) debounced 400ms and updates the glass receipt panel in real time.
4. **Step 4 — Finishing.** Toggle list of applicable `finishing_options` for that product, each adding its flat price live.
5. **Step 5 — Result.** Full breakdown + Save as Quote / Add to Cart. If `requiresStaffReview = true`, instead show "This item needs a quick review from our team — we'll confirm your price shortly" and creates a `pending_review` quote + notifies staff, rather than a self-serve instant price (applies to signage_engrave_cut_formula, range_service_fee, and any area_based_range product where no default-in-range policy is set).

## 4. Free-text description (post-MVP, noted for architecture readiness)
Phase 2 goal: a text box ("Describe your project in your own words") that uses an LLM to pre-fill the Step-2 form fields (category, material, size, qty) from a paragraph, then hands off to the exact same deterministic `calculatePrice` engine — the LLM only ever *fills the form*, it never computes or overrides a price itself. This keeps every price auditable and reproducible even if free-text parsing is added later.

## 5. Testing strategy
- Golden-file unit tests per `pricing_model`, seeded with real numbers transcribed from the two source PDFs (e.g. "Roll-up broad base → 250,000", "A3 offset poster qty 1000 → 700-800 recommended range", "Acrylic 6mm, 5 sheets → tier 0-10 @ 100% markup rate"). Any catalog price edit that breaks a golden test fails CI, forcing a deliberate re-approval of the test fixture.
