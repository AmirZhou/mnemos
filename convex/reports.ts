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
        return { ...machine, batches };
      })
    );

    const downtime = await ctx.db
      .query("downtimeEntries")
      .withIndex("by_report", (q) => q.eq("reportId", args.reportId))
      .collect();

    const activities = await ctx.db
      .query("activityEntries")
      .withIndex("by_report", (q) => q.eq("reportId", args.reportId))
      .collect();

    return {
      ...report,
      machines: machinesWithBatches,
      downtime,
      activities,
    };
  },
});

export const create = mutation({
  args: {
    date: v.string(),
    userId: v.id("users"),
    cellId: v.number(),
    shift: v.string(),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    return await ctx.db.insert("dailyReports", {
      date: args.date,
      userId: args.userId,
      cellId: args.cellId,
      shift: args.shift,
      generalNotes: "",
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const updateNotes = mutation({
  args: {
    reportId: v.id("dailyReports"),
    generalNotes: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.reportId, {
      generalNotes: args.generalNotes,
      updatedAt: Date.now(),
    });
  },
});

export const updateShift = mutation({
  args: {
    reportId: v.id("dailyReports"),
    shift: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.reportId, {
      shift: args.shift,
      updatedAt: Date.now(),
    });
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
