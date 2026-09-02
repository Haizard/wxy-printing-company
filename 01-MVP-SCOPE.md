# MVP Scope

## Goal of MVP
Prove that one system can (a) hold the full catalog, (b) calculate a correct price for any of the six pricing models in the source documents, and (c) move a quote into a trackable job — with an iOS-glass UI that works on desktop and mobile.

## In scope for MVP

### A. Catalog & Categories
- Category / Sub-category / Product CRUD (admin).
- Each product tagged with a `pricing_model` (see engine doc).
- Product images, description, min order qty, lead time.

### B. Price Calculator (core differentiator — build first)
- Guided "Describe your project" flow:
  1. Pick category (e.g. "Large Format / Banner", "Digital Printing / Books", "Signage / Acrylic").
  2. Form adapts to that category's pricing model (dimensions in cm/m, GSM/material, quantity, sides, finishing add-ons).
  3. Engine resolves the matching price band(s), computes subtotal + finishing + markup, shows breakdown.
  4. Save as **Quote** (linked to customer, editable, expires in N days) or add to **Cart**.
- Manual override field (with reason) for staff — always logged.
- Support the two "computed" categories that need geometry: A3-sheet-based book imposition (ups per sheet) and flat-bed sheet/sqm cutting price.

### C. Web Shop (fixed-price items only)
- Browse by category, product detail page, add to cart, checkout (cash/invoice/mobile money placeholder), order confirmation.
- Cart items for "calculated" products carry the saved quote snapshot (price is frozen at add-to-cart time).

### D. Job / Project Management
- Kanban board: `Quote → Confirmed → In Production → QA → Ready for Pickup → Delivered/Closed`.
- Job detail: linked quote/order, files/artwork uploads, internal notes, status history, assigned staff.
- Basic notifications on status change (in-app; email/SMS later).

### E. Inventory (lightweight)
- Item master (paper stock, vinyl rolls, acrylic sheets, ink, sticker rolls) with unit, reorder level, current qty.
- Manual stock in/out; auto-decrement stub hook when a job is marked "In Production" (full auto-BOM deduction is post-MVP).
- Low-stock dashboard widget.

### F. Chat
- One thread per Quote/Job (customer ⟷ staff).
- Text + file/image attachment.
- Internal-only staff notes toggle (not visible to customer) on the same job.

### G. Accounts & Roles
- Auth (email/phone + password, OTP optional later).
- Roles from overview doc; route guarding by role.

### H. Dashboard (role-aware home)
- Customer: active quotes, active jobs, order history.
- Staff: job queue, today's quotes, low-stock alerts.
- Admin: revenue snapshot, top categories, pending approvals.

## Explicitly out of scope for MVP (Phase 2+)
- Full automatic BOM/material consumption per job.
- Online payment gateway integration (Stripe/Flutterwave/M-Pesa) — MVP shows "Pay on delivery / Invoice" only.
- Multi-branch / multi-warehouse inventory.
- AI-assisted quote parsing from free text ("customer describes project in a paragraph, system extracts spec") — MVP uses the guided form; free-text parsing is a fast-follow once the guided engine is proven.
- Supplier purchase-order workflow.
- Customer loyalty/discount tiers beyond the volume markup already in price bands.
- Native mobile app (MVP is responsive web with iOS-pattern UI, not a compiled app).

## MVP acceptance criteria (sample)
- [ ] Staff can quote a "Roll-up Banner, Broad Base" and get 250,000 TZS.
- [ ] Staff can quote "A3 Poster, Offset, 150gsm, qty 1000" using the offset A3 table and get 180 TZS/pc mark-up range applied correctly.
- [ ] Staff can quote "Acrylic 6mm sign, 3 sheets, cutting only" using the flat-bed sheet pricing table with correct markup tier.
- [ ] Staff can quote an HP Indigo A4 booklet (e.g. 200 copies, 80gsm, 2 A3-sheet ups) via the book imposition helper.
- [ ] A quote converts into a Job visible on the kanban board.
- [ ] A customer and staff member can exchange chat messages on that job.
- [ ] Inventory item can be manually decremented and shows on low-stock widget when below reorder level.
- [ ] All screens render as iOS-style translucent/glass cards on a light background, 2-column card grid on mobile.
