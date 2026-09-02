# Product Taxonomy (Categories & Sub-categories)

Derived from `pg_1.pdf` (internal costing) and `WXY_PRICE_LIST_CATALOGUE.pdf` (customer catalog). This is the seed structure for the `categories` / `products` tables. Each leaf lists which **pricing model** applies (defined fully in `08-PRICE-CALCULATOR-ENGINE.md`).

## 1. Digital Printing (HP Indigo)
- Sheet/Sticker paper printing by GSM band (80–150, 170–250, 300–350, sticker) → **Model: `qty_band_per_unit`**
- A3 Posters (135/150 gsm) → **`qty_band_per_unit`**
- Books & Booklets (A4/A5/DL/custom, digitally printed, imposed on A3 sheets) → **`imposition_sheet_based`**
- Business cards (single/double sided, w/ or w/o lamination) → **`flat_fixed_per_unit_band`**

## 2. Digital Printing (Xerox / toner, coverage-based)
- Sub-categories by ink coverage: 0–20%, 20–50%, 50–100%
- Each: single-side / double-side, qty bands 0-100 → 1000+ → **`coverage_qty_band`**

## 3. Offset Printing
- A2 Poster (150gsm)
- A1 Poster (170gsm)
- A3 Poster (135/150gsm)
- A4 Brochures (135gsm)
- A5 / DL brochures
→ **`qty_band_per_unit`** (with note: recommended retail = 100% markup on supplier cost; up to 30% discount allowed)

## 4. Calendars
- **Desk/Table Calendars** — Digital, double-sided: sizes A3, A5, DL. Leaf count: 6/7/12/13. Optional Hard Base add-on. → **`qty_band_by_leaf_count`**
- **Wall Calendars** — Offset, sizes A3/A2/A1. Leaf count 7/13, design fee flat. → **`qty_band_by_leaf_count`** + flat design fee.
- Internal cost-only reference tables (30/50/80% markup tiers) are **not customer-facing**; used only to validate recommended sell price. → flagged `internal_only = true`.

## 5. Large Format — Solvent / Eco-Solvent (per m²)
Sub-categories (material types), each with **three quality/price tiers** (tier 1 lowest, tier 3 highest — the PDF shows 3 escalating price bands per material) and a flat "less than 1 sqm" minimum charge:
- Banners: black-back, double-sided, reflective, backlit flex, white-back, flag, rollup material
- Vinyls: white glossy, white matte, clear, one-way vision, reflective, frost (local/imported), wallpaper (local/imported)
→ **Model: `area_based_range` (min–max price per m², with `min_charge_below_1sqm`)**

## 6. Flat-Bed Rigid Media (Acrylic / Forex / Corex / ABS / Milky Acrylic)
- Materials: Acrylic 3/4/6/8/10/12mm, Milky Acrylic, Forex 2/3/4/5mm, Corex 3/4/5mm, ABS 0.8/1/2mm
- Pricing is **per full sheet**, with **quantity-of-sheets markup tiers**: 0–10 sheets (100% markup, 40,000/sqm base), 10–25 (80%, 30,000/sqm), 25–50 (50%, 25,000/sqm), 50–100 (30%, 20,000/sqm)
→ **Model: `sheet_qty_tier_markup`**

## 7. Rigid-Media Structures (finished products)
- Roll-up stand (narrow/broad base), X-stand, Tear-drop (3/4.5/5m), Telescopic banner (3/4m)
→ **`flat_fixed_range_per_unit`** (price range per piece, size variant)

## 8. Signage
- Door signs (engraved acrylic, 2D sign, gold/silver) → **`flat_fixed_per_unit_band`**
- Indoor 2D sign (with/without LED, size cap 80cm) → **`flat_fixed_per_unit_band`**
- Light box, pylon sign, 3D sign, small sign & sticker design → **`flat_fixed_service_fee`**
- **Complex/Custom Signage** (engraving & cutting) — Sheet price by material + (cutting hrs × hourly cutting rate) + (engraving hrs × hourly engraving rate), divided by ups-per-sheet → **Model: `signage_engrave_cut_formula`** (requires Signage Manager approval workflow, see MVP notes)

## 9. Photo & Canvas
- Canvas + Frame (7 fixed sizes) → **`flat_fixed_per_unit_band`**
- Photo Gloss/Matt/Canvas w/wo frame (per sq ft, range) → **`area_based_range`**
- Picha Mbao (photo-on-wood) A5/A4/A3/A2/A1 → **`flat_fixed_per_unit_band`**
- Photo Book 40x30, hardcover, 24pg → **`flat_fixed_service_fee`**
- Customised Clock A3/A2 → **`flat_fixed_per_unit_band`**

## 10. Cards & Small-Format Print
- Brochure A4 double-sided (qty bands) → **`qty_band_per_unit`**
- Flyer A5/A6 single/double side → **`flat_fixed_per_unit_band`**
- Business card (100pc, w/wo lamination) → **`flat_fixed_per_unit_band`**
- PVC ID Card (plain / with lanyard / with printed lanyard) → **`flat_fixed_per_unit_band`**
- Name tags (Epoxy/Engraving finish, Magnetic/Pin) → **`flat_fixed_per_unit_band`** + MOQ 5

## 11. Books, Publications & Stationery
- Company Profile (per page + flat design cost) → **`per_page_plus_design_fee`**
- Product Catalogue (UV/engraving option) → **`flat_fixed_per_unit_band`**
- Diary printing (UV/engraving) → **`flat_fixed_per_unit_band`**
- Notebook printing (customised/ready-made) → **`flat_fixed_per_unit_band`**

## 12. Promotional / Branded Merchandise
- Bottle printing (small/large) → **`flat_fixed_per_unit_band`**
- Pen printing → flat unit price
- Cap & Hat printing (embroidery / DTF) → flat unit price
- Umbrella printing (small/large, 3 sides) → **`flat_fixed_per_unit_band`**
- Engraved chain → flat unit price
- Metal keychains (round/rectangle single/double sided, square/rectangle acrylic) → **`qty_band_per_unit`**
- Non-woven bags (D-cut, A5/A4/A3/A2, per 100 pcs) → **`qty_band_per_unit`**
- Mugs (Magic / white / colour handle & rim, by size) → **`qty_band_per_unit`**
- Wheel covers — 2 catalogs: plain branding wheel covers (qty-tiered, per-type) and promo/photo wheel covers (flat, MOQ 2) → **`qty_band_per_unit`** and **`flat_fixed_per_unit_band`**

## 13. Apparel / Digitization
- Embroidery digitization by stitch count band → **`qty_band_per_unit`** (unit = per stitch)
- Heat-transfer numbering by size (cm², qty band) → **`area_qty_band`**

## 14. Design Services (flat fee)
- Logo design packages: Basic / Standard / Premium / Exclusive (tiered feature bundles) → **`package_tier_flat_fee`**
- Single/double-sided simple design (flyer/brochure/poster/card) → **`flat_fixed_service_fee`**
- Books & Magazines layout — per-page rate band (0-25, 25-50, 50-100, 100+) → **`per_page_band`**
- Logo w/ 3 changes + paid extra revisions → **`flat_fixed_service_fee` + add-on**
- Signage mockups / Apparel mockups → **`flat_fixed_service_fee`**
- Alteration to existing design → **`range_service_fee`** (complexity-dependent)
- Vehicle & Office branding → **`percentage_markup_on_material`** (20%+, depends on material)

## 15. Finishing Add-ons (applied on top of any base product)
Creasing, Saddle stitch, Perfect bind, Hardcover binding, Ring wire, Folding, Lamination (per A3 side) — each a flat **per-unit or per-sheet add-on** selectable in the calculator after base price is computed. Modeled as `finishing_options` rows attachable to a quote line.

## Category tree (compact)
```
Digital Printing
 ├─ HP Indigo (paper, sticker, posters, books, business cards)
 └─ Xerox (by coverage %)
Offset Printing
 ├─ Posters (A1/A2/A3)
 └─ Brochures (A4/A5/DL)
Calendars
 ├─ Desk/Table
 └─ Wall
Large Format
 ├─ Solvent/Eco-Solvent (banners, vinyl, flags)
 ├─ Rigid Structures (rollup, x-stand, teardrop, telescopic, blade)
 └─ Flat-Bed Rigid Media (acrylic, forex, corex, ABS)
Signage
 ├─ Door Signs / Indoor 2D
 ├─ Light Box / Pylon / 3D
 └─ Custom Engrave & Cut (quote workflow)
Photo & Canvas
Cards & Small Format (flyers, brochures, cards, ID cards, name tags)
Books & Stationery (profiles, catalogues, diaries, notebooks)
Promotional Merchandise (bottles, pens, caps, umbrellas, keychains, bags, mugs, wheel covers, chains)
Apparel & Digitization
Design Services (logo, layout, mockups, branding, alterations)
Finishing (cross-cutting add-ons)
```
