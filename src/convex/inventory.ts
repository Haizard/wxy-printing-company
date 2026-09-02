import { v } from "convex/values";
import { query, mutation } from "./_generated/server";

export const list = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("inventoryItems").collect();
  },
});

export const get = query({
  args: { id: v.id("inventoryItems") },
  handler: async (ctx, args) => {
    const item = await ctx.db.get(args.id);
    if (!item) return null;

    const movements = await ctx.db
      .query("inventoryMovements")
      .withIndex("by_item", (q) => q.eq("itemId", args.id))
      .collect();

    return { ...item, movements };
  },
});

export const lowStock = query({
  args: {},
  handler: async (ctx) => {
    const items = await ctx.db.query("inventoryItems").collect();
    return items.filter((item) => item.currentQty < item.reorderLevel);
  },
});

export const create = mutation({
  args: {
    name: v.string(),
    sku: v.optional(v.string()),
    unit: v.string(),
    currentQty: v.number(),
    reorderLevel: v.number(),
    unitCost: v.optional(v.number()),
    supplier: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("inventoryItems", args);
  },
});

export const recordMovement = mutation({
  args: {
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
  },
  handler: async (ctx, args) => {
    const item = await ctx.db.get(args.itemId);
    if (!item) throw new Error("Inventory item not found");

    // Calculate new quantity
    let newQty = item.currentQty;
    if (args.movementType === "in") {
      newQty += args.quantity;
    } else if (args.movementType === "out") {
      if (args.quantity > item.currentQty) {
        throw new Error("Insufficient stock");
      }
      newQty -= args.quantity;
    } else {
      // adjustment
      newQty = args.quantity;
    }

    // Update item quantity
    await ctx.db.patch(args.itemId, { currentQty: newQty });

    // Log movement
    return await ctx.db.insert("inventoryMovements", {
      itemId: args.itemId,
      jobId: args.jobId,
      movementType: args.movementType,
      quantity: args.quantity,
      reason: args.reason,
      createdBy: args.createdBy,
    });
  },
});
