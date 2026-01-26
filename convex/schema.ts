import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  users: defineTable({
    name: v.string(),
    defaultCell: v.optional(v.number()),
  }),

  dailyReports: defineTable({
    date: v.string(),
    userId: v.id("users"),
    cellId: v.number(),
    shift: v.string(),
    generalNotes: v.string(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_user_date", ["userId", "date"])
    .index("by_date", ["date"]),

  machineEntries: defineTable({
    reportId: v.id("dailyReports"),
    machineId: v.string(),
  }).index("by_report", ["reportId"]),

  batchEntries: defineTable({
    machineEntryId: v.id("machineEntries"),
    batchNumber: v.optional(v.string()),
    partCode: v.string(),
    partName: v.optional(v.string()),
    goodQty: v.number(),
    scrapQty: v.number(),
    scrapReason: v.optional(v.string()),
  }).index("by_machine_entry", ["machineEntryId"]),

  downtimeEntries: defineTable({
    reportId: v.id("dailyReports"),
    machineId: v.optional(v.string()),
    reason: v.string(),
    startTime: v.optional(v.string()), // "HH:MM" format (new)
    endTime: v.optional(v.string()), // "HH:MM" format (new)
    durationMinutes: v.optional(v.number()), // legacy field
  }).index("by_report", ["reportId"]),

  activityEntries: defineTable({
    reportId: v.id("dailyReports"),
    type: v.string(),
    durationMinutes: v.optional(v.number()),
    notes: v.optional(v.string()),
  }).index("by_report", ["reportId"]),

  recentParts: defineTable({
    userId: v.id("users"),
    partCode: v.string(),
    partName: v.optional(v.string()),
    lastUsed: v.number(),
  }).index("by_user", ["userId"]),
});
