import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

export const getRecentForUser = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("recentParts")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();
  },
});

export const recordUsage = mutation({
  args: {
    userId: v.id("users"),
    partCode: v.string(),
    partName: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("recentParts")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .filter((q) => q.eq(q.field("partCode"), args.partCode))
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, {
        partName: args.partName ?? existing.partName,
        lastUsed: Date.now(),
      });
    } else {
      await ctx.db.insert("recentParts", {
        userId: args.userId,
        partCode: args.partCode,
        partName: args.partName,
        lastUsed: Date.now(),
      });
    }
  },
});
