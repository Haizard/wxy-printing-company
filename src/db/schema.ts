import {
  pgTable,
  uuid,
  text,
  integer,
  numeric,
  boolean,
  timestamp,
  date,
  jsonb,
  pgEnum,
  uniqueIndex,
  index,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// ── Enums ───────────────────────────────────────────────────────────────────

export const userRoleEnum = pgEnum("user_role", [
  "customer",
  "sales",
  "production",
  "inventory_manager",
  "admin",
]);

export const quoteStatusEnum = pgEnum("quote_status", [
  "draft",
  "sent",
  "accepted",
  "expired",
  "converted",
]);

export const jobStatusEnum = pgEnum("job_status", [
  "quote",
  "confirmed",
  "in_production",
  "qa",
  "ready",
  "delivered",
  "closed",
]);

export const jobPriorityEnum = pgEnum("job_priority", [
  "low",
  "normal",
  "high",
  "urgent",
]);

export const orderStatusEnum = pgEnum("order_status", [
  "pending",
  "paid",
  "partially_paid",
  "cancelled",
]);

export const movementTypeEnum = pgEnum("movement_type", [
  "in",
  "out",
  "adjustment",
]);

// ── Users ───────────────────────────────────────────────────────────────────

export const users = pgTable(
  "users",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    fullName: text("full_name").notNull(),
    email: text("email").unique(),
    phone: text("phone").unique(),
    passwordHash: text("password_hash"),
    role: userRoleEnum("role").notNull().default("customer"),
    avatarUrl: text("avatar_url"),
    createdAt: timestamp("created_at").defaultNow(),
    isActive: boolean("is_active").default(true),
  },
  (table) => ({
    emailIdx: uniqueIndex("users_email_idx").on(table.email),
    phoneIdx: uniqueIndex("users_phone_idx").on(table.phone),
  }),
);

// ── Categories ──────────────────────────────────────────────────────────────

export const categories = pgTable(
  "categories",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    parentId: uuid("parent_id").references((): any => categories.id),
    name: text("name").notNull(),
    slug: text("slug").unique().notNull(),
    icon: text("icon"),
    sortOrder: integer("sort_order").default(0),
    internalOnly: boolean("internal_only").default(false),
  },
  (table) => ({
    slugIdx: uniqueIndex("categories_slug_idx").on(table.slug),
    parentIdx: index("categories_parent_idx").on(table.parentId),
  }),
);

// ── Products ────────────────────────────────────────────────────────────────

export const products = pgTable(
  "products",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    categoryId: uuid("category_id")
      .notNull()
      .references(() => categories.id),
    name: text("name").notNull(),
    slug: text("slug").unique().notNull(),
    description: text("description"),
    images: text("images").array(),
    pricingModel: text("pricing_model").notNull(),
    baseUnit: text("base_unit"),
    minOrderQty: integer("min_order_qty").default(1),
    leadTimeDays: integer("lead_time_days"),
    isActive: boolean("is_active").default(true),
    isShopVisible: boolean("is_shop_visible").default(true),
    createdAt: timestamp("created_at").defaultNow(),
  },
  (table) => ({
    slugIdx: uniqueIndex("products_slug_idx").on(table.slug),
    categoryIdx: index("products_category_idx").on(table.categoryId),
    pricingModelIdx: index("products_pricing_model_idx").on(table.pricingModel),
  }),
);

// ── Product Options ─────────────────────────────────────────────────────────

export const productOptions = pgTable(
  "product_options",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    productId: uuid("product_id")
      .notNull()
      .references(() => products.id),
    optionKey: text("option_key").notNull(),
    optionLabel: text("option_label").notNull(),
    inputType: text("input_type").notNull(), // 'select' | 'number' | 'dimension' | 'boolean'
    isRequired: boolean("is_required").default(true),
    sortOrder: integer("sort_order").default(0),
  },
  (table) => ({
    productIdx: index("product_options_product_idx").on(table.productId),
  }),
);

export const productOptionValues = pgTable(
  "product_option_values",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    productOptionId: uuid("product_option_id")
      .notNull()
      .references(() => productOptions.id),
    valueKey: text("value_key").notNull(),
    valueLabel: text("value_label").notNull(),
    sortOrder: integer("sort_order").default(0),
  },
  (table) => ({
    optionIdx: index("product_option_values_option_idx").on(
      table.productOptionId,
    ),
  }),
);

// ── Pricing Engine ──────────────────────────────────────────────────────────

export const priceRules = pgTable(
  "price_rules",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    productId: uuid("product_id")
      .notNull()
      .references(() => products.id),
    pricingModel: text("pricing_model").notNull(),
    optionFilter: jsonb("option_filter").default({}),
    markupPercent: numeric("markup_percent"),
    minCharge: integer("min_charge"),
    currency: text("currency").default("TZS"),
    isInternalCost: boolean("is_internal_cost").default(false),
    activeFrom: date("active_from").defaultNow(),
    activeTo: date("active_to"),
    createdBy: uuid("created_by").references(() => users.id),
    createdAt: timestamp("created_at").defaultNow(),
  },
  (table) => ({
    productIdx: index("price_rules_product_idx").on(table.productId),
    activeIdx: index("price_rules_active_idx").on(
      table.activeFrom,
      table.activeTo,
    ),
  }),
);

export const priceBands = pgTable(
  "price_bands",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    priceRuleId: uuid("price_rule_id")
      .notNull()
      .references(() => priceRules.id),
    qtyMin: integer("qty_min"),
    qtyMax: integer("qty_max"),
    areaMin: numeric("area_min"),
    areaMax: numeric("area_max"),
    unitPriceMin: integer("unit_price_min").notNull(),
    unitPriceMax: integer("unit_price_max"),
    sideCount: integer("side_count"),
    leafCount: integer("leaf_count"),
    sortOrder: integer("sort_order").default(0),
  },
  (table) => ({
    ruleIdx: index("price_bands_rule_idx").on(table.priceRuleId),
  }),
);

// ── Finishing Options ───────────────────────────────────────────────────────

export const finishingOptions = pgTable("finishing_options", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  unit: text("unit").notNull(),
  price: integer("price").notNull(),
});

export const productFinishingOptions = pgTable(
  "product_finishing_options",
  {
    productId: uuid("product_id")
      .notNull()
      .references(() => products.id),
    finishingOptionId: uuid("finishing_option_id")
      .notNull()
      .references(() => finishingOptions.id),
  },
  (table) => ({
    productIdx: index("product_finishing_options_product_idx").on(
      table.productId,
    ),
  }),
);

// ── Quotes ──────────────────────────────────────────────────────────────────

export const quotes = pgTable(
  "quotes",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    quoteNumber: text("quote_number").unique().notNull(),
    customerId: uuid("customer_id")
      .notNull()
      .references(() => users.id),
    createdBy: uuid("created_by").references(() => users.id),
    status: quoteStatusEnum("status").default("draft"),
    expiresAt: timestamp("expires_at"),
    subtotal: integer("subtotal").notNull().default(0),
    total: integer("total").notNull().default(0),
    notes: text("notes"),
    createdAt: timestamp("created_at").defaultNow(),
  },
  (table) => ({
    customerIdx: index("quotes_customer_idx").on(table.customerId),
    statusIdx: index("quotes_status_idx").on(table.status),
  }),
);

export const quoteLines = pgTable(
  "quote_lines",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    quoteId: uuid("quote_id")
      .notNull()
      .references(() => quotes.id),
    productId: uuid("product_id")
      .notNull()
      .references(() => products.id),
    inputSpec: jsonb("input_spec").notNull(),
    matchedPriceRuleId: uuid("matched_price_rule_id").references(
      () => priceRules.id,
    ),
    matchedBandId: uuid("matched_band_id").references(() => priceBands.id),
    computedUnitPrice: integer("computed_unit_price").notNull(),
    quantity: integer("quantity").notNull().default(1),
    finishingTotal: integer("finishing_total").default(0),
    lineTotal: integer("line_total").notNull(),
    isManualOverride: boolean("is_manual_override").default(false),
    overrideReason: text("override_reason"),
    overriddenBy: uuid("overridden_by").references(() => users.id),
  },
  (table) => ({
    quoteIdx: index("quote_lines_quote_idx").on(table.quoteId),
  }),
);

// ── Orders ──────────────────────────────────────────────────────────────────

export const orders = pgTable(
  "orders",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    orderNumber: text("order_number").unique().notNull(),
    quoteId: uuid("quote_id").references(() => quotes.id),
    customerId: uuid("customer_id")
      .notNull()
      .references(() => users.id),
    status: orderStatusEnum("status").default("pending"),
    total: integer("total").notNull(),
    paymentMethod: text("payment_method"),
    createdAt: timestamp("created_at").defaultNow(),
  },
  (table) => ({
    customerIdx: index("orders_customer_idx").on(table.customerId),
    statusIdx: index("orders_status_idx").on(table.status),
  }),
);

// ── Jobs ────────────────────────────────────────────────────────────────────

export const jobs = pgTable(
  "jobs",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    jobNumber: text("job_number").unique().notNull(),
    orderId: uuid("order_id").references(() => orders.id),
    title: text("title").notNull(),
    status: jobStatusEnum("status").default("confirmed"),
    assignedTo: uuid("assigned_to").references(() => users.id),
    priority: jobPriorityEnum("priority").default("normal"),
    dueDate: date("due_date"),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
  },
  (table) => ({
    statusIdx: index("jobs_status_idx").on(table.status),
    assigneeIdx: index("jobs_assignee_idx").on(table.assignedTo),
  }),
);

export const jobStatusHistory = pgTable(
  "job_status_history",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    jobId: uuid("job_id")
      .notNull()
      .references(() => jobs.id),
    fromStatus: text("from_status"),
    toStatus: text("to_status").notNull(),
    changedBy: uuid("changed_by")
      .notNull()
      .references(() => users.id),
    changedAt: timestamp("changed_at").defaultNow(),
    note: text("note"),
  },
  (table) => ({
    jobIdx: index("job_status_history_job_idx").on(table.jobId),
  }),
);

export const jobFiles = pgTable(
  "job_files",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    jobId: uuid("job_id")
      .notNull()
      .references(() => jobs.id),
    fileUrl: text("file_url").notNull(),
    fileType: text("file_type"),
    uploadedBy: uuid("uploaded_by")
      .notNull()
      .references(() => users.id),
    uploadedAt: timestamp("uploaded_at").defaultNow(),
  },
  (table) => ({
    jobIdx: index("job_files_job_idx").on(table.jobId),
  }),
);

// ── Inventory ───────────────────────────────────────────────────────────────

export const inventoryItems = pgTable(
  "inventory_items",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    name: text("name").notNull(),
    sku: text("sku").unique(),
    unit: text("unit").notNull(),
    currentQty: numeric("current_qty").notNull().default("0"),
    reorderLevel: numeric("reorder_level").notNull().default("0"),
    unitCost: integer("unit_cost"),
    supplier: text("supplier"),
    linkedProductOptionValueId: uuid("linked_product_option_value_id"),
  },
  (table) => ({
    skuIdx: uniqueIndex("inventory_items_sku_idx").on(table.sku),
  }),
);

export const inventoryMovements = pgTable(
  "inventory_movements",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    itemId: uuid("item_id")
      .notNull()
      .references(() => inventoryItems.id),
    jobId: uuid("job_id").references(() => jobs.id),
    movementType: movementTypeEnum("movement_type").notNull(),
    quantity: numeric("quantity").notNull(),
    reason: text("reason"),
    createdBy: uuid("created_by")
      .notNull()
      .references(() => users.id),
    createdAt: timestamp("created_at").defaultNow(),
  },
  (table) => ({
    itemIdx: index("inventory_movements_item_idx").on(table.itemId),
  }),
);

// ── Chat ────────────────────────────────────────────────────────────────────

export const chatThreads = pgTable(
  "chat_threads",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    jobId: uuid("job_id").references(() => jobs.id),
    quoteId: uuid("quote_id").references(() => quotes.id),
    isInternal: boolean("is_internal").default(false),
    createdAt: timestamp("created_at").defaultNow(),
  },
  (table) => ({
    jobIdx: index("chat_threads_job_idx").on(table.jobId),
  }),
);

export const chatMessages = pgTable(
  "chat_messages",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    threadId: uuid("thread_id")
      .notNull()
      .references(() => chatThreads.id),
    senderId: uuid("sender_id")
      .notNull()
      .references(() => users.id),
    body: text("body"),
    attachmentUrl: text("attachment_url"),
    createdAt: timestamp("created_at").defaultNow(),
    readBy: uuid("read_by").array().default([]),
  },
  (table) => ({
    threadIdx: index("chat_messages_thread_idx").on(table.threadId),
  }),
);

// ── Relations ───────────────────────────────────────────────────────────────

export const categoriesRelations = relations(categories, ({ many, one }) => ({
  parent: one(categories, {
    fields: [categories.parentId],
    references: [categories.id],
  }),
  children: many(categories),
  products: many(products),
}));

export const productsRelations = relations(products, ({ one, many }) => ({
  category: one(categories, {
    fields: [products.categoryId],
    references: [categories.id],
  }),
  options: many(productOptions),
  priceRules: many(priceRules),
  finishingOptions: many(productFinishingOptions),
}));

export const priceRulesRelations = relations(priceRules, ({ one, many }) => ({
  product: one(products, {
    fields: [priceRules.productId],
    references: [products.id],
  }),
  bands: many(priceBands),
}));

export const priceBandsRelations = relations(priceBands, ({ one }) => ({
  rule: one(priceRules, {
    fields: [priceBands.priceRuleId],
    references: [priceRules.id],
  }),
}));

export const quotesRelations = relations(quotes, ({ one, many }) => ({
  customer: one(users, {
    fields: [quotes.customerId],
    references: [users.id],
  }),
  lines: many(quoteLines),
}));

export const jobsRelations = relations(jobs, ({ one }) => ({
  order: one(orders, {
    fields: [jobs.orderId],
    references: [orders.id],
  }),
  assignee: one(users, {
    fields: [jobs.assignedTo],
    references: [users.id],
  }),
}));
