import { v } from "convex/values";
import { query, mutation } from "./_generated/server";

export const list = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("products").collect();
  },
});

export const listByCategory = query({
  args: { categoryId: v.id("categories") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("products")
      .withIndex("by_category", (q) => q.eq("categoryId", args.categoryId))
      .collect();
  },
});

export const getBySlug = query({
  args: { slug: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("products")
      .withIndex("by_slug", (q) => q.eq("slug", args.slug))
      .unique();
  },
});

export const getWithOptions = query({
  args: { productId: v.id("products") },
  handler: async (ctx, args) => {
    const product = await ctx.db.get(args.productId);
    if (!product) return null;

    const options = await ctx.db
      .query("productOptions")
      .withIndex("by_product", (q) => q.eq("productId", args.productId))
      .collect();

    const optionsWithValues = await Promise.all(
      options.map(async (opt) => {
        const values = await ctx.db
          .query("productOptionValues")
          .withIndex("by_option", (q) => q.eq("productOptionId", opt._id))
          .collect();
        return { ...opt, values };
      }),
    );

    return { ...product, options: optionsWithValues };
  },
});

export const create = mutation({
  args: {
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
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("products", args);
  },
});

export const update = mutation({
  args: {
    id: v.id("products"),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
    isActive: v.optional(v.boolean()),
    isShopVisible: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const { id, ...updates } = args;
    await ctx.db.patch(id, updates);
  },
});
