# Project Structure & Tech Stack

## 1. Suggested stack
- **Frontend:** Next.js (React) + TypeScript, Tailwind CSS (custom glass tokens — see UI Design System doc), Framer Motion for iOS-style transitions, Zustand or React Query for state/data fetching.
- **Backend:** Node.js (NestJS or Express) + TypeScript, REST (or tRPC) API.
- **Database:** PostgreSQL (relational integrity matters for pricing rules, inventory, jobs).
- **Realtime chat:** WebSocket layer (Socket.IO) or a managed realtime DB channel.
- **File storage:** S3-compatible bucket (artwork, catalog images, mockups).
- **Auth:** JWT session + refresh tokens; role claims in token.
- **Cache:** Redis for resolved price-band lookups and session data.

This stack is a recommendation, not a hard requirement — the schema/API contracts in the other docs are framework-agnostic.

## 2. Monorepo layout

```
printhub/
├── apps/
│   ├── web/                      # Next.js customer + staff web app (one app, role-based routing)
│   │   ├── app/                  # App Router
│   │   │   ├── (public)/         # marketing / login / signup
│   │   │   ├── (shop)/           # catalog, product detail, cart, checkout
│   │   │   ├── (dashboard)/      # role-aware dashboard shell
│   │   │   │   ├── calculator/   # price calculator flow
│   │   │   │   ├── quotes/
│   │   │   │   ├── jobs/         # kanban + job detail
│   │   │   │   ├── inventory/
│   │   │   │   ├── catalog-admin/
│   │   │   │   ├── chat/
│   │   │   │   └── reports/
│   │   │   └── layout.tsx
│   │   ├── components/
│   │   │   ├── ui/               # glass Button, Card, Sheet, Segmented, Tabs, Modal, Toast...
│   │   │   ├── calculator/       # dynamic form renderer per pricing_model
│   │   │   ├── catalog/
│   │   │   ├── jobs/
│   │   │   ├── inventory/
│   │   │   └── chat/
│   │   ├── lib/                  # api client, auth, formatting (TZS), hooks
│   │   ├── styles/               # tailwind.config, glass tokens, globals.css
│   │   └── public/
│   └── api/                       # backend service
│       ├── src/
│       │   ├── modules/
│       │   │   ├── auth/
│       │   │   ├── catalog/           # categories, products
│       │   │   ├── pricing/           # price_rules, price_bands, calculator resolver
│       │   │   ├── quotes/
│       │   │   ├── orders/
│       │   │   ├── jobs/
│       │   │   ├── inventory/
│       │   │   ├── chat/
│       │   │   └── users/
│       │   ├── common/                # guards, interceptors, pipes
│       │   └── main.ts
│       └── test/
├── packages/
│   ├── shared-types/              # TS types shared FE/BE (Product, PriceRule, Job, Quote...)
│   ├── pricing-engine/            # PURE pricing calculation library (no framework deps) — see doc 08
│   └── config/                    # eslint/tsconfig/tailwind presets
├── infra/
│   ├── db/
│   │   ├── migrations/
│   │   └── seed/                  # seed scripts loading the two source PDFs' data as rows
│   └── docker-compose.yml
└── docs/                          # this file set
```

## 3. Why `pricing-engine` is its own package
The calculator must be:
- Unit-testable in isolation (given a `pricing_model` + input spec + matching `price_bands`, assert output price).
- Reusable server-side (authoritative quote calculation) and client-side (live preview while the customer/staff fills the form) — same logic, no duplication/drift.

## 4. API surface (high level)
```
GET    /categories                       # tree
GET    /categories/:id/products
GET    /products/:id
GET    /products/:id/pricing-schema      # which pricing_model + input fields to render
POST   /calculator/quote                 # {productId | categoryId, inputs} -> {price, breakdown}
POST   /quotes                           # persist a calculated quote
GET    /quotes/:id
POST   /quotes/:id/convert-to-order
GET    /orders/:id
POST   /jobs/:id/status                  # move kanban column
GET    /jobs?status=&assignee=
GET    /inventory/items
POST   /inventory/items/:id/movement
GET    /chat/threads/:jobId
POST   /chat/threads/:jobId/messages     # also over websocket
```

## 5. Environments
- `local` — docker-compose (postgres, redis, minio for S3-compatible storage).
- `staging` — mirrors prod, seeded with sample catalog.
- `production`.

## 6. Naming & conventions
- DB tables: `snake_case`, plural (`price_bands`).
- API routes: `kebab-case`.
- React components: `PascalCase`, hooks `useCamelCase`.
- All money fields stored as **integer TZS (no decimals)** to avoid float rounding — matches source pricing sheets which are whole-number TZS.
