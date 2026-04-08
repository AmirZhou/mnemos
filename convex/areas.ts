import { query } from "./_generated/server";
import { v } from "convex/values";

export const getRecentForUser = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const entries = await ctx.db
      .query("recentAreas")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();
    entries.sort((a, b) => b.lastUsed - a.lastUsed);
    return entries;
  },
});
