import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

export const getByUserAndDate = query({
  args: {
    userId: v.id("users"),
    date: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("dailyReports")
      .withIndex("by_user_date", (q) =>
        q.eq("userId", args.userId).eq("date", args.date)
      )
      .first();
  },
});

export const getFullReport = query({
  args: { reportId: v.id("dailyReports") },
  handler: async (ctx, args) => {
    const report = await ctx.db.get(args.reportId);
    if (!report) return null;

    const machineEntries = await ctx.db
      .query("machineEntries")
      .withIndex("by_report", (q) => q.eq("reportId", args.reportId))
      .collect();

    const machinesWithBatches = await Promise.all(
      machineEntries.map(async (machine) => {
        const batches = await ctx.db
          .query("batchEntries")
          .withIndex("by_machine_entry", (q) =>
            q.eq("machineEntryId", machine._id)
          )
          .collect();
        batches.sort((a, b) => a.order - b.order);
        return { ...machine, batches };
      })
    );

    machinesWithBatches.sort((a, b) => a.order - b.order);

    const notes = await ctx.db
      .query("noteEntries")
      .withIndex("by_report", (q) => q.eq("reportId", args.reportId))
      .collect();
    notes.sort((a, b) => a.order - b.order);

    return {
      ...report,
      machines: machinesWithBatches,
      notes,
    };
  },
});

export const create = mutation({
  args: {
    date: v.string(),
    userId: v.id("users"),
    shift: v.string(),
    area: v.string(),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const reportId = await ctx.db.insert("dailyReports", {
      date: args.date,
      userId: args.userId,
      shift: args.shift,
      area: args.area,
      createdAt: now,
      updatedAt: now,
    });

    // Record area usage for future suggestions
    const existingArea = await ctx.db
      .query("recentAreas")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .filter((q) => q.eq(q.field("area"), args.area))
      .first();
    if (existingArea) {
      await ctx.db.patch(existingArea._id, { lastUsed: now });
    } else {
      await ctx.db.insert("recentAreas", {
        userId: args.userId,
        area: args.area,
        lastUsed: now,
      });
    }

    return reportId;
  },
});

export const updateMeta = mutation({
  args: {
    reportId: v.id("dailyReports"),
    shift: v.optional(v.string()),
    area: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { reportId, ...patch } = args;
    const cleaned: Record<string, unknown> = { updatedAt: Date.now() };
    if (patch.shift !== undefined) cleaned.shift = patch.shift;
    if (patch.area !== undefined) cleaned.area = patch.area;
    await ctx.db.patch(reportId, cleaned);
  },
});

export const listByUser = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("dailyReports")
      .withIndex("by_user_date", (q) => q.eq("userId", args.userId))
      .order("desc")
      .take(30);
  },
});
