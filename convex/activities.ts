import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

export const listForReport = query({
  args: { reportId: v.id("dailyReports") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("activityEntries")
      .withIndex("by_report", (q) => q.eq("reportId", args.reportId))
      .collect();
  },
});

export const add = mutation({
  args: {
    reportId: v.id("dailyReports"),
    type: v.string(),
    durationMinutes: v.optional(v.number()),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.reportId, { updatedAt: Date.now() });

    return await ctx.db.insert("activityEntries", {
      reportId: args.reportId,
      type: args.type,
      durationMinutes: args.durationMinutes,
      notes: args.notes,
    });
  },
});

export const update = mutation({
  args: {
    id: v.id("activityEntries"),
    type: v.string(),
    durationMinutes: v.optional(v.number()),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { id, ...data } = args;
    await ctx.db.patch(id, data);
  },
});

export const remove = mutation({
  args: { id: v.id("activityEntries") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
  },
});
