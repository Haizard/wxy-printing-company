import { v } from "convex/values";
import { query, mutation } from "./_generated/server";

export const list = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("jobs").collect();
  },
});

export const listByStatus = query({
  args: {
    status: v.union(
      v.literal("quote"),
      v.literal("confirmed"),
      v.literal("in_production"),
      v.literal("qa"),
      v.literal("ready"),
      v.literal("delivered"),
      v.literal("closed"),
    ),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("jobs")
      .withIndex("by_status", (q) => q.eq("status", args.status))
      .collect();
  },
});

export const get = query({
  args: { id: v.id("jobs") },
  handler: async (ctx, args) => {
    const job = await ctx.db.get(args.id);
    if (!job) return null;

    const history = await ctx.db
      .query("jobStatusHistory")
      .withIndex("by_job", (q) => q.eq("jobId", args.id))
      .collect();

    const files = await ctx.db
      .query("jobFiles")
      .withIndex("by_job", (q) => q.eq("jobId", args.id))
      .collect();

    return { ...job, history, files };
  },
});

export const create = mutation({
  args: {
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
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("jobs", args);
  },
});

export const updateStatus = mutation({
  args: {
    id: v.id("jobs"),
    status: v.union(
      v.literal("quote"),
      v.literal("confirmed"),
      v.literal("in_production"),
      v.literal("qa"),
      v.literal("ready"),
      v.literal("delivered"),
      v.literal("closed"),
    ),
    changedBy: v.id("users"),
    note: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const job = await ctx.db.get(args.id);
    if (!job) throw new Error("Job not found");

    const fromStatus = job.status;

    // Log status history
    await ctx.db.insert("jobStatusHistory", {
      jobId: args.id,
      fromStatus,
      toStatus: args.status,
      changedBy: args.changedBy,
      note: args.note,
    });

    // Update job status
    await ctx.db.patch(args.id, { status: args.status });
  },
});

export const assign = mutation({
  args: {
    id: v.id("jobs"),
    assignedTo: v.id("users"),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, { assignedTo: args.assignedTo });
  },
});
