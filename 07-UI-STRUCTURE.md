# UI Structure — Pages, Layout & Navigation

This doc maps `02-PROJECT-STRUCTURE.md`'s route groups to concrete screens, and applies `06-UI-DESIGN-SYSTEM.md` tokens to each. Read together with that doc — this file defines *what* exists per screen, that one defines *how it's styled*.

## 1. App shell

### Desktop (≥1280px) — "macOS/iPadOS split view"
```
┌──────────────────────────────────────────────────────────┐
│  .material-chrome window bar (search, notifications, avatar)│
├───────────┬─────────────────────────────────┬─────────────┤
│  Sidebar  │        Content Canvas            │  Context    │
│ (nav,     │  (page content, max-width 1400,  │  Rail       │
│  material │   centered, glass cards/grids)    │ (optional:  │
│  -thick)  │                                    │  calculator │
│           │                                    │  receipt,   │
│           │                                    │  chat panel)│
└───────────┴─────────────────────────────────┴─────────────┘
```
Sidebar sections (role-filtered): Home · Catalog · Price Calculator · Quotes · Orders · Jobs · Inventory · Chat · Reports · Catalog Admin (admin only) · Settings.

### Mobile / small screen (<768px) — native iOS pattern
```
┌──────────────────────────────┐
│ .material-thick top nav bar   │  ← large title, collapses on scroll
│  (title + trailing action)    │
├───────────────────────────────┤
│                               │
│   Content (2-col card grid    │
│   by default for any list of  │
│   cards/products/widgets)     │
│                               │
├───────────────────────────────┤
│ .material-chrome bottom tabs  │  ← Home / Catalog / Calculate / Jobs / Chat
└───────────────────────────────┘
```
No visible browser chrome cues: no underlined links, no default select dropdowns (use bottom-sheet pickers), no OS scrollbars (custom thin translucent scrollbar or hidden with momentum scroll) — reinforces "this is an app."

## 2. Route → Screen map

### Public
- `/` — Marketing/landing (hero, category showcase, CTA to shop or get a quote). Light glass hero card over gradient background.
- `/login`, `/signup` — Centered glass card form, iOS-style grouped inputs, Face-ID-style icon placeholder for "continue" (no real biometric, just visual language).

### Shop (customer-facing)
- `/shop` — Category grid (2-col mobile / N-col desktop), search bar pinned under nav (`.material-thin` pill search field, iOS-style with magnifier icon).
- `/shop/[category]` — Sub-category chips (horizontal scroll, segmented-pill style) + product grid.
- `/shop/product/[id]` — Product detail: image carousel, description, "Calculate price" button (routes into calculator pre-filled with this product) or "Add to cart" if `pricing_model = flat_fixed_*` and no inputs are required.
- `/cart` — List of cart lines (glass rows), sticky total footer.
- `/checkout` — Address/contact confirm → payment method select (segmented control: Cash on delivery / Invoice) → confirm.

### Price Calculator (core flow — desktop context rail shows live receipt; mobile shows a bottom sheet receipt)
- `/calculator` — Step 1: category picker (large glass tiles, icon + name, 2-col mobile).
- `/calculator/[categorySlug]` — Step 2: dynamic form rendered from `product_options` for the chosen category/product (see `08-PRICE-CALCULATOR-ENGINE.md` §4 for field-generation rules). Grouped-list iOS form style. Inline live price preview updates as fields are completed (debounced call to `pricing-engine`).
- `/calculator/[categorySlug]/result` — Full breakdown card: base price, quantity band applied, finishing add-ons (toggle list with iOS switches), subtotal, total. Actions: "Save as Quote", "Add to Cart", "Adjust".
- Staff-only: manual override control (glass text field + reason) appears only for `sales`/`admin` roles.

### Quotes
- `/quotes` — List (segmented filter: Draft / Sent / Accepted / Expired), 2-col mobile card grid showing quote number, customer, total, status chip.
- `/quotes/[id]` — Quote detail: line items (glass rows), totals, "Send to customer" / "Convert to Order" actions, linked chat thread panel.

### Orders
- `/orders`, `/orders/[id]` — Mirrors quotes pattern; order detail shows payment status and "Create Job" action.

### Jobs (Kanban)
- `/jobs` — Kanban board (desktop: horizontal scroll columns; mobile: segmented column switcher + 2-col card grid within active column).
- `/jobs/[id]` — Job detail: status stepper (iOS-style horizontal progress track), assigned staff avatar, file uploads (drag/drop card on desktop, tap-to-upload on mobile), status history timeline, embedded chat thread, embedded inventory-consumption log.

### Inventory
- `/inventory` — Item grid (2-col mobile) with stock-level ring/bar indicator (iOS "Activity ring" style: green = healthy, amber = near reorder, red = below reorder).
- `/inventory/[id]` — Item detail: movement history list, "Record movement" glass form sheet.

### Chat
- `/chat` — Thread list (avatar, last message preview, unread badge pill).
- `/chat/[threadId]` — Full-screen message view (mobile) or right-rail panel (desktop) with iOS Messages-bubble styling from design doc.

### Catalog Admin (admin/sales-lead only)
- `/catalog-admin/categories` — Tree editor, drag-to-reorder.
- `/catalog-admin/products/[id]` — Product form + `product_options` builder + linked `price_rules`/`price_bands` table editor (spreadsheet-like glass table, inline-editable cells) — this is where the two source PDFs' numbers get entered/edited without a code deploy.

### Reports (admin)
- `/reports` — Dashboard widgets: revenue by category, top products, low-stock alerts, job throughput funnel. Widget grid, 2-col mobile.

### Settings
- `/settings` — Profile, role/permissions (admin), notification prefs, theme (future dark-mode toggle).

## 3. Layout composition rules
1. Every page = `PageShell` (handles nav bar + safe-area) → `ContentCanvas` (max-width, padding) → one or more `GlassSection` blocks → `GlassCard`/`GlassGrid`/`GlassList` primitives from the component library in `02-PROJECT-STRUCTURE.md §2`.
2. **Two-column rule (mobile):** Any repeated card collection (`GlassGrid`) defaults to `grid-template-columns: repeat(2, 1fr)` below 768px — category tiles, product cards, dashboard widgets, inventory items, quote/job summary cards, chat previews are all `GlassGrid` consumers, so this is enforced once at the primitive level, not per-page.
3. **Detail pages** (single-entity, e.g. product detail, job detail, quote detail) are the exception — single column, full width, on mobile.
4. **Forms** never use a grid on mobile — always single-column grouped-list rows (iOS form convention), except explicitly paired inputs (Width × Height, Qty stepper + unit).
5. Sticky/contextual elements: cart total footer, calculator live-price rail, chat input bar — always `.material-chrome`, pinned, safe-area aware.

## 4. Empty/loading/error states
- Loading: skeleton glass cards (shimmer over `.material-subtle`), never a plain spinner on a blank white/dark screen.
- Empty state: centered icon + short copy + primary glass button, consistent card container.
- Errors: inline glass banner (`--accent-danger` tint) at top of the relevant section, not a browser `alert()`.

## 5. Responsive breakpoints (single source of truth)
```
sm:  0–767px    → mobile, iOS phone pattern, bottom tabs, 2-col grids
md:  768–1023px → tablet, iOS iPad pattern, 3-col grids, sidebar becomes collapsible
lg:  1024–1279px→ small desktop, sidebar visible, 4-col grids
xl:  1280px+    → full desktop, sidebar + content + context rail, up to 6-col grids
```
