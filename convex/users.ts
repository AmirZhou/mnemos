import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

export const list = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("users").collect();
  },
});

export const get = query({
  args: { id: v.id("users") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

export const create = mutation({
  args: {
    name: v.string(),
    defaultCell: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("users", {
      name: args.name,
      defaultCell: args.defaultCell,
    });
  },
});

export const updateDefaultCell = mutation({
  args: {
    id: v.id("users"),
    defaultCell: v.number(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, { defaultCell: args.defaultCell });
  },
});
