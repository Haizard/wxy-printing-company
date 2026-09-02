import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  // ── Users ────────────────────────────────────────────────────────────────
  users: defineTable({
    name: v.string(),
    email: v.optional(v.string()),
    phone: v.optional(v.string()),
    role: v.union(
      v.literal("customer"),
      v.literal("sales"),
      v.literal("production"),
      v.literal("inventory_manager"),
      v.literal("admin"),
    ),
    avatarUrl: v.optional(v.string()),
    isActive: v.boolean(),
  })
    .index("by_email", ["email"])
    .index("by_phone", ["phone"]),

  // ── Categories ───────────────────────────────────────────────────────────
  categories: defineTable({
    parentId: v.optional(v.id("categories")),
    name: v.string(),
    slug: v.string(),
    icon: v.optional(v.string()),
    sortOrder: v.number(),
    internalOnly: v.boolean(),
  })
    .index("by_slug", ["slug"])
    .index("by_parent", ["parentId"]),

  // ── Products ─────────────────────────────────────────────────────────────
  products: defineTable({
    categoryId: v.id("categories"),
    name: v.string(),
    slug: v.string(),
    description: v.optional(v.string()),
    images: v.optional(v.array(v.string())),
    pricingModel: v.string(),
    baseUnit: v.optional(v.string()),
    minOrderQty: v.number(),
    leadTimeDays: v.optional(v.number()),
    isActive: v.boolean(),
    isShopVisible: v.boolean(),
  })
    .index("by_category", ["categoryId"])
    .index("by_slug", ["slug"])
    .index("by_pricing_model", ["pricingModel"]),

  // ── Product Options ──────────────────────────────────────────────────────
  productOptions: defineTable({
    productId: v.id("products"),
    optionKey: v.string(),
    optionLabel: v.string(),
    inputType: v.union(
      v.literal("select"),
      v.literal("number"),
      v.literal("dimension"),
      v.literal("boolean"),
    ),
    isRequired: v.boolean(),
    sortOrder: v.number(),
  }).index("by_product", ["productId"]),

  productOptionValues: defineTable({
    productOptionId: v.id("productOptions"),
    valueKey: v.string(),
    valueLabel: v.string(),
    sortOrder: v.number(),
  }).index("by_option", ["productOptionId"]),

  // ── Pricing Engine ───────────────────────────────────────────────────────
  priceRules: defineTable({
    productId: v.id("products"),
    pricingModel: v.string(),
    optionFilter: v.any(), // jsonb
    markupPercent: v.optional(v.number()),
    minCharge: v.optional(v.number()),
    currency: v.string(),
    isInternalCost: v.boolean(),
    activeFrom: v.string(), // date as string
    activeTo: v.optional(v.string()),
    createdBy: v.optional(v.id("users")),
  })
    .index("by_product", ["productId"])
    .index("by_active", ["activeFrom", "activeTo"]),

  priceBands: defineTable({
    priceRuleId: v.id("priceRules"),
    qtyMin: v.optional(v.number()),
    qtyMax: v.optional(v.number()),
    areaMin: v.optional(v.number()),
    areaMax: v.optional(v.number()),
    unitPriceMin: v.number(),
    unitPriceMax: v.optional(v.number()),
    sideCount: v.optional(v.number()),
    leafCount: v.optional(v.number()),
    sortOrder: v.number(),
  }).index("by_rule", ["priceRuleId"]),

  finishingOptions: defineTable({
    name: v.string(),
    unit: v.string(),
    price: v.number(),
  }),

  productFinishingOptions: defineTable({
    productId: v.id("products"),
    finishingOptionId: v.id("finishingOptions"),
  }).index("by_product", ["productId"]),

  // ── Quotes ───────────────────────────────────────────────────────────────
  quotes: defineTable({
    quoteNumber: v.string(),
    customerId: v.id("users"),
    createdBy: v.optional(v.id("users")),
    status: v.union(
      v.literal("draft"),
      v.literal("sent"),
      v.literal("accepted"),
      v.literal("expired"),
      v.literal("converted"),
    ),
    expiresAt: v.optional(v.string()),
    subtotal: v.number(),
    total: v.number(),
    notes: v.optional(v.string()),
  })
    .index("by_customer", ["customerId"])
    .index("by_status", ["status"]),

  quoteLines: defineTable({
    quoteId: v.id("quotes"),
    productId: v.id("products"),
    inputSpec: v.any(), // jsonb
    matchedPriceRuleId: v.optional(v.id("priceRules")),
    matchedBandId: v.optional(v.id("priceBands")),
    computedUnitPrice: v.number(),
    quantity: v.number(),
    finishingTotal: v.number(),
    lineTotal: v.number(),
    isManualOverride: v.boolean(),
    overrideReason: v.optional(v.string()),
    overriddenBy: v.optional(v.id("users")),
  }).index("by_quote", ["quoteId"]),

  // ── Orders ───────────────────────────────────────────────────────────────
  orders: defineTable({
    orderNumber: v.string(),
    quoteId: v.optional(v.id("quotes")),
    customerId: v.id("users"),
    status: v.union(
      v.literal("pending"),
      v.literal("paid"),
      v.literal("partially_paid"),
      v.literal("cancelled"),
    ),
    total: v.number(),
    paymentMethod: v.optional(v.string()),
  })
    .index("by_customer", ["customerId"])
    .index("by_status", ["status"]),

  // ── Jobs ─────────────────────────────────────────────────────────────────
  jobs: defineTable({
    jobNumber: v.string(),
    orderId: v.optional(v.id("orders")),
    title: v.string(),
    status: v.union(
      v.literal("quote"),
      v.literal("confirmed"),
      v.literal("in_production"),
      v.literal("qa"),
      v.literal("ready"),
      v.literal("delivered"),
      v.literal("closed"),
    ),
    assignedTo: v.optional(v.id("users")),
    priority: v.union(
      v.literal("low"),
      v.literal("normal"),
      v.literal("high"),
      v.literal("urgent"),
    ),
    dueDate: v.optional(v.string()),
  })
    .index("by_status", ["status"])
    .index("by_assignee", ["assignedTo"]),

  jobStatusHistory: defineTable({
    jobId: v.id("jobs"),
    fromStatus: v.optional(v.string()),
    toStatus: v.string(),
    changedBy: v.id("users"),
    note: v.optional(v.string()),
  }).index("by_job", ["jobId"]),

  jobFiles: defineTable({
    jobId: v.id("jobs"),
    fileUrl: v.string(),
    fileType: v.optional(v.string()),
    uploadedBy: v.id("users"),
  }).index("by_job", ["jobId"]),

  // ── Inventory ────────────────────────────────────────────────────────────
  inventoryItems: defineTable({
    name: v.string(),
    sku: v.optional(v.string()),
    unit: v.string(),
    currentQty: v.number(),
    reorderLevel: v.number(),
    unitCost: v.optional(v.number()),
    supplier: v.optional(v.string()),
  }).index("by_sku", ["sku"]),

  inventoryMovements: defineTable({
    itemId: v.id("inventoryItems"),
    jobId: v.optional(v.id("jobs")),
    movementType: v.union(
      v.literal("in"),
      v.literal("out"),
      v.literal("adjustment"),
    ),
    quantity: v.number(),
    reason: v.optional(v.string()),
    createdBy: v.id("users"),
  }).index("by_item", ["itemId"]),

  // ── Chat ─────────────────────────────────────────────────────────────────
  chatThreads: defineTable({
    jobId: v.optional(v.id("jobs")),
    quoteId: v.optional(v.id("quotes")),
    isInternal: v.boolean(),
  }).index("by_job", ["jobId"]),

  chatMessages: defineTable({
    threadId: v.id("chatThreads"),
    senderId: v.id("users"),
    body: v.optional(v.string()),
    attachmentUrl: v.optional(v.string()),
    readBy: v.array(v.id("users")),
  }).index("by_thread", ["threadId"]),
});
