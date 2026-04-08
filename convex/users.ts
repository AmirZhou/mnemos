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
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("users", {
      name: args.name,
    });
  },
});

export const setDefaultArea = mutation({
  args: {
    id: v.id("users"),
    defaultArea: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, { defaultArea: args.defaultArea });
  },
});
