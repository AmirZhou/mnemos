import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

export const listForReport = query({
  args: { reportId: v.id("dailyReports") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("downtimeEntries")
      .withIndex("by_report", (q) => q.eq("reportId", args.reportId))
      .collect();
  },
});

export const add = mutation({
  args: {
    reportId: v.id("dailyReports"),
    machineId: v.optional(v.string()),
    reason: v.string(),
    startTime: v.string(),
    endTime: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.reportId, { updatedAt: Date.now() });

    return await ctx.db.insert("downtimeEntries", {
      reportId: args.reportId,
      machineId: args.machineId,
      reason: args.reason,
      startTime: args.startTime,
      endTime: args.endTime,
    });
  },
});

export const update = mutation({
  args: {
    id: v.id("downtimeEntries"),
    machineId: v.optional(v.string()),
    reason: v.string(),
    startTime: v.string(),
    endTime: v.string(),
  },
  handler: async (ctx, args) => {
    const { id, ...data } = args;
    await ctx.db.patch(id, data);
  },
});

export const remove = mutation({
  args: { id: v.id("downtimeEntries") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
  },
});
