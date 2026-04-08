import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

async function getReportUserId(ctx: any, reportId: any) {
  const report = await ctx.db.get(reportId);
  return report?.userId;
}

async function touchReport(ctx: any, reportId: any) {
  await ctx.db.patch(reportId, { updatedAt: Date.now() });
}

export const listForReport = query({
  args: { reportId: v.id("dailyReports") },
  handler: async (ctx, args) => {
    const entries = await ctx.db
      .query("machineEntries")
      .withIndex("by_report", (q) => q.eq("reportId", args.reportId))
      .collect();

    const withBatches = await Promise.all(
      entries.map(async (entry) => {
        const batches = await ctx.db
          .query("batchEntries")
          .withIndex("by_machine_entry", (q) =>
            q.eq("machineEntryId", entry._id)
          )
          .collect();
        batches.sort((a, b) => a.order - b.order);
        return { ...entry, batches };
      })
    );

    withBatches.sort((a, b) => a.order - b.order);
    return withBatches;
  },
});

export const addMachine = mutation({
  args: {
    reportId: v.id("dailyReports"),
    machineId: v.string(),
    jobNumber: v.optional(v.string()),
    description: v.optional(v.string()),
    startTime: v.optional(v.string()),
    endTime: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Prevent duplicate machine IDs on the same report
    const existing = await ctx.db
      .query("machineEntries")
      .withIndex("by_report", (q) => q.eq("reportId", args.reportId))
      .filter((q) => q.eq(q.field("machineId"), args.machineId))
      .first();
    if (existing) return existing._id;

    // Place at end
    const siblings = await ctx.db
      .query("machineEntries")
      .withIndex("by_report", (q) => q.eq("reportId", args.reportId))
      .collect();
    const nextOrder =
      siblings.reduce((max, m) => Math.max(max, m.order), -1) + 1;

    const id = await ctx.db.insert("machineEntries", {
      reportId: args.reportId,
      machineId: args.machineId,
      jobNumber: args.jobNumber,
      description: args.description,
      startTime: args.startTime,
      endTime: args.endTime,
      order: nextOrder,
    });

    // Record machine usage for future prefill
    const userId = await getReportUserId(ctx, args.reportId);
    if (userId) {
      const recent = await ctx.db
        .query("recentMachines")
        .withIndex("by_user", (q) => q.eq("userId", userId))
        .filter((q) => q.eq(q.field("machineId"), args.machineId))
        .first();
      const payload = {
        lastUsed: Date.now(),
        lastJobNumber: args.jobNumber ?? recent?.lastJobNumber,
        lastDescription: args.description ?? recent?.lastDescription,
      };
      if (recent) {
        await ctx.db.patch(recent._id, payload);
      } else {
        await ctx.db.insert("recentMachines", {
          userId,
          machineId: args.machineId,
          ...payload,
        });
      }
    }

    await touchReport(ctx, args.reportId);
    return id;
  },
});

export const updateMachine = mutation({
  args: {
    machineEntryId: v.id("machineEntries"),
    jobNumber: v.optional(v.string()),
    description: v.optional(v.string()),
    startTime: v.optional(v.string()),
    endTime: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { machineEntryId, ...rest } = args;
    const existing = await ctx.db.get(machineEntryId);
    if (!existing) return;

    await ctx.db.patch(machineEntryId, {
      jobNumber: rest.jobNumber,
      description: rest.description,
      startTime: rest.startTime,
      endTime: rest.endTime,
    });

    // Update sticky memory on the owning user
    const userId = await getReportUserId(ctx, existing.reportId);
    if (userId) {
      const recent = await ctx.db
        .query("recentMachines")
        .withIndex("by_user", (q) => q.eq("userId", userId))
        .filter((q) => q.eq(q.field("machineId"), existing.machineId))
        .first();
      const payload = {
        lastUsed: Date.now(),
        lastJobNumber: rest.jobNumber ?? recent?.lastJobNumber,
        lastDescription: rest.description ?? recent?.lastDescription,
      };
      if (recent) {
        await ctx.db.patch(recent._id, payload);
      }
    }

    await touchReport(ctx, existing.reportId);
  },
});

export const removeMachine = mutation({
  args: { machineEntryId: v.id("machineEntries") },
  handler: async (ctx, args) => {
    const entry = await ctx.db.get(args.machineEntryId);
    if (!entry) return;

    // Cascade-delete batches
    const batches = await ctx.db
      .query("batchEntries")
      .withIndex("by_machine_entry", (q) =>
        q.eq("machineEntryId", args.machineEntryId)
      )
      .collect();
    for (const b of batches) {
      await ctx.db.delete(b._id);
    }

    await ctx.db.delete(args.machineEntryId);
    await touchReport(ctx, entry.reportId);
  },
});

export const addBatch = mutation({
  args: {
    machineEntryId: v.id("machineEntries"),
    partCode: v.string(),
    qty: v.number(),
    scrapQty: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const entry = await ctx.db.get(args.machineEntryId);
    if (!entry) throw new Error("Machine entry not found");

    const siblings = await ctx.db
      .query("batchEntries")
      .withIndex("by_machine_entry", (q) =>
        q.eq("machineEntryId", args.machineEntryId)
      )
      .collect();
    const nextOrder =
      siblings.reduce((max, b) => Math.max(max, b.order), -1) + 1;

    const id = await ctx.db.insert("batchEntries", {
      machineEntryId: args.machineEntryId,
      partCode: args.partCode,
      qty: args.qty,
      scrapQty: args.scrapQty && args.scrapQty > 0 ? args.scrapQty : undefined,
      order: nextOrder,
    });
    await touchReport(ctx, entry.reportId);
    return id;
  },
});

export const updateBatch = mutation({
  args: {
    batchId: v.id("batchEntries"),
    partCode: v.string(),
    qty: v.number(),
    scrapQty: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const { batchId, ...data } = args;
    const batch = await ctx.db.get(batchId);
    if (!batch) return;
    await ctx.db.patch(batchId, {
      partCode: data.partCode,
      qty: data.qty,
      scrapQty: data.scrapQty && data.scrapQty > 0 ? data.scrapQty : undefined,
    });
    const entry = await ctx.db.get(batch.machineEntryId);
    if (entry) await touchReport(ctx, entry.reportId);
  },
});

export const deleteBatch = mutation({
  args: { batchId: v.id("batchEntries") },
  handler: async (ctx, args) => {
    const batch = await ctx.db.get(args.batchId);
    if (!batch) return;
    await ctx.db.delete(args.batchId);
    const entry = await ctx.db.get(batch.machineEntryId);
    if (entry) await touchReport(ctx, entry.reportId);
  },
});

export const getRecentForUser = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const entries = await ctx.db
      .query("recentMachines")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();
    entries.sort((a, b) => b.lastUsed - a.lastUsed);
    return entries;
  },
});
