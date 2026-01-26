import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

export const getOrCreateMachineEntry = mutation({
  args: {
    reportId: v.id("dailyReports"),
    machineId: v.string(),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("machineEntries")
      .withIndex("by_report", (q) => q.eq("reportId", args.reportId))
      .filter((q) => q.eq(q.field("machineId"), args.machineId))
      .first();

    if (existing) return existing._id;

    return await ctx.db.insert("machineEntries", {
      reportId: args.reportId,
      machineId: args.machineId,
    });
  },
});

export const getBatchesForMachine = query({
  args: { machineEntryId: v.id("machineEntries") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("batchEntries")
      .withIndex("by_machine_entry", (q) =>
        q.eq("machineEntryId", args.machineEntryId)
      )
      .collect();
  },
});

export const addBatch = mutation({
  args: {
    machineEntryId: v.id("machineEntries"),
    batchNumber: v.optional(v.string()),
    partCode: v.string(),
    partName: v.optional(v.string()),
    goodQty: v.number(),
    scrapQty: v.number(),
    scrapReason: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Update report timestamp
    const machineEntry = await ctx.db.get(args.machineEntryId);
    if (machineEntry) {
      await ctx.db.patch(machineEntry.reportId, { updatedAt: Date.now() });
    }

    return await ctx.db.insert("batchEntries", {
      machineEntryId: args.machineEntryId,
      batchNumber: args.batchNumber,
      partCode: args.partCode,
      partName: args.partName,
      goodQty: args.goodQty,
      scrapQty: args.scrapQty,
      scrapReason: args.scrapReason,
    });
  },
});

export const updateBatch = mutation({
  args: {
    batchId: v.id("batchEntries"),
    batchNumber: v.optional(v.string()),
    partCode: v.string(),
    partName: v.optional(v.string()),
    goodQty: v.number(),
    scrapQty: v.number(),
    scrapReason: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { batchId, ...data } = args;
    await ctx.db.patch(batchId, data);
  },
});

export const deleteBatch = mutation({
  args: { batchId: v.id("batchEntries") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.batchId);
  },
});

export const getMachineEntriesForReport = query({
  args: { reportId: v.id("dailyReports") },
  handler: async (ctx, args) => {
    const entries = await ctx.db
      .query("machineEntries")
      .withIndex("by_report", (q) => q.eq("reportId", args.reportId))
      .collect();

    return await Promise.all(
      entries.map(async (entry) => {
        const batches = await ctx.db
          .query("batchEntries")
          .withIndex("by_machine_entry", (q) =>
            q.eq("machineEntryId", entry._id)
          )
          .collect();
        return { ...entry, batches };
      })
    );
  },
});
