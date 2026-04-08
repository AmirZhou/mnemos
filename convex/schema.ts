import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  users: defineTable({
    name: v.string(),
    defaultArea: v.optional(v.string()),
  }),

  dailyReports: defineTable({
    date: v.string(),
    userId: v.id("users"),
    shift: v.string(),
    area: v.string(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_user_date", ["userId", "date"])
    .index("by_date", ["date"]),

  machineEntries: defineTable({
    reportId: v.id("dailyReports"),
    machineId: v.string(),
    jobNumber: v.optional(v.string()),
    description: v.optional(v.string()),
    startTime: v.optional(v.string()), // "HH:MM"
    endTime: v.optional(v.string()), // "HH:MM"
    order: v.number(),
  }).index("by_report", ["reportId"]),

  batchEntries: defineTable({
    machineEntryId: v.id("machineEntries"),
    partCode: v.string(),
    qty: v.number(), // total produced; includes scraps
    scrapQty: v.optional(v.number()),
    order: v.number(),
  }).index("by_machine_entry", ["machineEntryId"]),

  noteEntries: defineTable({
    reportId: v.id("dailyReports"),
    category: v.union(v.literal("operational"), v.literal("credit")),
    title: v.string(),
    body: v.string(),
    order: v.number(),
  }).index("by_report", ["reportId"]),

  recentParts: defineTable({
    userId: v.id("users"),
    partCode: v.string(),
    lastUsed: v.number(),
  }).index("by_user", ["userId"]),

  recentMachines: defineTable({
    userId: v.id("users"),
    machineId: v.string(),
    lastUsed: v.number(),
    lastJobNumber: v.optional(v.string()),
    lastDescription: v.optional(v.string()),
  }).index("by_user", ["userId"]),

  recentAreas: defineTable({
    userId: v.id("users"),
    area: v.string(),
    lastUsed: v.number(),
  }).index("by_user", ["userId"]),
});
