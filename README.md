# PrintHub OS — Documentation Set

Read in this order:

1. `00-PROJECT-OVERVIEW.md` — what the system is and why.
2. `01-MVP-SCOPE.md` — what to build first, acceptance criteria.
3. `02-PROJECT-STRUCTURE.md` — tech stack, monorepo layout, API surface.
4. `03-PRODUCT-TAXONOMY.md` — full category/sub-category map from the two source PDFs.
5. `04-DATABASE-SCHEMA.md` — tables and relationships.
6. `05-DATABASE-RULES.md` — integrity, governance, and pricing-data rules.
7. `06-UI-DESIGN-SYSTEM.md` — iOS glassmorphism visual language (tokens, materials, components).
8. `07-UI-STRUCTURE.md` — pages, layouts, navigation, responsive grid rules.
9. `08-PRICE-CALCULATOR-ENGINE.md` — the seven pricing models and the resolution algorithm; this is the heart of the product.

## Golden rules baked into this doc set
- Pricing lives in the database (`price_rules` / `price_bands`), never in application code — repricing is a data change, not a deploy.
- No dark/black backgrounds anywhere — light gradient canvas with translucent iOS-style glass surfaces throughout, on every page/container/component/form/button.
- Mobile card/product/widget grids are always 2 columns.
- Every quote is reproducible: price rules are versioned (`active_from`/`active_to`), manual overrides are logged with a reason.
- Some categories (custom engraved signage, alteration jobs, area-based ranges) are intentionally **staff-reviewed**, not instant — the engine flags these rather than guessing.
# wxy-printing-company
