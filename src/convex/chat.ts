import { v } from "convex/values";
import { query, mutation } from "./_generated/server";

export const listThreads = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("chatThreads").collect();
  },
});

export const getThread = query({
  args: { threadId: v.id("chatThreads") },
  handler: async (ctx, args) => {
    const thread = await ctx.db.get(args.threadId);
    if (!thread) return null;

    const messages = await ctx.db
      .query("chatMessages")
      .withIndex("by_thread", (q) => q.eq("threadId", args.threadId))
      .collect();

    return { ...thread, messages };
  },
});

export const createThread = mutation({
  args: {
    jobId: v.optional(v.id("jobs")),
    quoteId: v.optional(v.id("quotes")),
    isInternal: v.boolean(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("chatThreads", args);
  },
});

export const sendMessage = mutation({
  args: {
    threadId: v.id("chatThreads"),
    senderId: v.id("users"),
    body: v.optional(v.string()),
    attachmentUrl: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("chatMessages", {
      threadId: args.threadId,
      senderId: args.senderId,
      body: args.body,
      attachmentUrl: args.attachmentUrl,
      readBy: [],
    });
  },
});

export const markAsRead = mutation({
  args: {
    messageId: v.id("chatMessages"),
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const message = await ctx.db.get(args.messageId);
    if (!message) return;

    if (!message.readBy.includes(args.userId)) {
      await ctx.db.patch(args.messageId, {
        readBy: [...message.readBy, args.userId],
      });
    }
  },
});
