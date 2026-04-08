import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

export const getRecentForUser = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const entries = await ctx.db
      .query("recentParts")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();
    entries.sort((a, b) => b.lastUsed - a.lastUsed);
    return entries;
  },
});

export const recordUsage = mutation({
  args: {
    userId: v.id("users"),
    partCode: v.string(),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("recentParts")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .filter((q) => q.eq(q.field("partCode"), args.partCode))
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, { lastUsed: Date.now() });
    } else {
      await ctx.db.insert("recentParts", {
        userId: args.userId,
        partCode: args.partCode,
        lastUsed: Date.now(),
      });
    }
  },
});
