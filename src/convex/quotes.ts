import { v } from "convex/values";
import { query, mutation } from "./_generated/server";

export const list = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("quotes").collect();
  },
});

export const listByStatus = query({
  args: {
    status: v.union(
      v.literal("draft"),
      v.literal("sent"),
      v.literal("accepted"),
      v.literal("expired"),
      v.literal("converted"),
    ),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("quotes")
      .withIndex("by_status", (q) => q.eq("status", args.status))
      .collect();
  },
});

export const get = query({
  args: { id: v.id("quotes") },
  handler: async (ctx, args) => {
    const quote = await ctx.db.get(args.id);
    if (!quote) return null;

    const lines = await ctx.db
      .query("quoteLines")
      .withIndex("by_quote", (q) => q.eq("quoteId", args.id))
      .collect();

    return { ...quote, lines };
  },
});

export const create = mutation({
  args: {
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
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("quotes", args);
  },
});

export const updateStatus = mutation({
  args: {
    id: v.id("quotes"),
    status: v.union(
      v.literal("draft"),
      v.literal("sent"),
      v.literal("accepted"),
      v.literal("expired"),
      v.literal("converted"),
    ),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, { status: args.status });
  },
});

export const addLine = mutation({
  args: {
    quoteId: v.id("quotes"),
    productId: v.id("products"),
    inputSpec: v.any(),
    matchedPriceRuleId: v.optional(v.id("priceRules")),
    matchedBandId: v.optional(v.id("priceBands")),
    computedUnitPrice: v.number(),
    quantity: v.number(),
    finishingTotal: v.number(),
    lineTotal: v.number(),
    isManualOverride: v.boolean(),
    overrideReason: v.optional(v.string()),
    overriddenBy: v.optional(v.id("users")),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("quoteLines", args);
  },
});
