import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

const categoryValidator = v.union(
  v.literal("operational"),
  v.literal("credit")
);

async function touchReport(ctx: any, reportId: any) {
  await ctx.db.patch(reportId, { updatedAt: Date.now() });
}

export const listForReport = query({
  args: { reportId: v.id("dailyReports") },
  handler: async (ctx, args) => {
    const notes = await ctx.db
      .query("noteEntries")
      .withIndex("by_report", (q) => q.eq("reportId", args.reportId))
      .collect();
    notes.sort((a, b) => a.order - b.order);
    return notes;
  },
});

export const add = mutation({
  args: {
    reportId: v.id("dailyReports"),
    category: categoryValidator,
    title: v.string(),
    body: v.string(),
  },
  handler: async (ctx, args) => {
    const siblings = await ctx.db
      .query("noteEntries")
      .withIndex("by_report", (q) => q.eq("reportId", args.reportId))
      .filter((q) => q.eq(q.field("category"), args.category))
      .collect();
    const nextOrder =
      siblings.reduce((max, n) => Math.max(max, n.order), -1) + 1;

    const id = await ctx.db.insert("noteEntries", {
      reportId: args.reportId,
      category: args.category,
      title: args.title,
      body: args.body,
      order: nextOrder,
    });
    await touchReport(ctx, args.reportId);
    return id;
  },
});

export const update = mutation({
  args: {
    id: v.id("noteEntries"),
    title: v.string(),
    body: v.string(),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db.get(args.id);
    if (!existing) return;
    await ctx.db.patch(args.id, { title: args.title, body: args.body });
    await touchReport(ctx, existing.reportId);
  },
});

export const remove = mutation({
  args: { id: v.id("noteEntries") },
  handler: async (ctx, args) => {
    const existing = await ctx.db.get(args.id);
    if (!existing) return;
    await ctx.db.delete(args.id);
    await touchReport(ctx, existing.reportId);
  },
});
