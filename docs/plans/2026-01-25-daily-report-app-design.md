# Setting Tools Daily Report App - Design Document

**Date:** 2026-01-25
**Status:** Ready for implementation

---

## Overview

Lightweight web app for Setting Tools department to record daily production reports per operator and cell. Replaces WhatsApp messages with structured inputs.

**Primary device:** iPad/tablet
**Backend:** Convex (https://upbeat-jaguar-481.convex.cloud)
**Deployment:** Railway
**Repository:** https://github.com/AmirZhou/mnemos.git

---

## Shop Configuration

- **Department:** Setting Tools
- **Cells:** 4 cells
- **Machines:** 16 total (STM 01 – STM 16)
- **Distribution:** 4 machines per cell
  - Cell 1: STM 01, STM 02, STM 03, STM 04
  - Cell 2: STM 05, STM 06, STM 07, STM 08
  - Cell 3: STM 09, STM 10, STM 11, STM 12
  - Cell 4: STM 13, STM 14, STM 15, STM 16

---

## User Flow

1. **Welcome** → Select name from dropdown
2. **Report Setup** → Date, Cell, Shift
3. **Cell Dashboard** → 4 machine buttons + tabs
4. **Machine Entry** → Add batches with parts/quantities
5. **Generate Report** → Preview and copy plain text

---

## Data Model (Convex Schema)

```typescript
// convex/schema.ts
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
    durationMinutes: v.number(),
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
```

---

## Hardcoded Configuration

```typescript
// src/config.ts
export const CELLS = [
  { id: 1, name: "Cell 1", machines: ["STM 01", "STM 02", "STM 03", "STM 04"] },
  { id: 2, name: "Cell 2", machines: ["STM 05", "STM 06", "STM 07", "STM 08"] },
  { id: 3, name: "Cell 3", machines: ["STM 09", "STM 10", "STM 11", "STM 12"] },
  { id: 4, name: "Cell 4", machines: ["STM 13", "STM 14", "STM 15", "STM 16"] },
];

export const SHIFTS = [
  { label: "Day Shift", value: "6am - 4pm" },
  { label: "Evening Shift", value: "4pm - 2am" },
];

export const DOWNTIME_REASONS = [
  "Waiting for material",
  "Machine down",
  "Tooling issue",
  "QC hold",
  "Flip machine",
  "Other",
];

export const SCRAP_REASONS = [
  "Insert",
  "Tooling wear",
  "Material defect",
  "Setup scrap",
  "Other",
];
```

---

## UI Design

### Aesthetic Direction: Industrial/Utilitarian

- **Colors:** Dark charcoal (#1a1a1a), amber accent (#f59e0b), muted grays
- **Typography:** IBM Plex Mono (machine IDs, numbers), IBM Plex Sans (labels)
- **Layout:** Large touch targets (60px+), card-based grid
- **Motion:** Subtle fade-ins, button press feedback

### Screen Components

1. **WelcomeScreen** - Name selection dropdown
2. **ReportSetup** - Date picker, cell selector, shift selector
3. **CellDashboard** - Machine grid + bottom tabs
4. **MachineGrid** - 4 chunky machine buttons showing status
5. **MachineEntryModal** - Batch entry form with list
6. **BatchForm** - Part code, name, quantities, scrap reason
7. **DowntimeTab** - Add/view downtime entries
8. **ActivitiesTab** - Add/view other activities
9. **NotesTab** - General notes text area
10. **ReportPreview** - Plain text preview + copy button

---

## Report Output Format

```
Setting Tools - Cell 1
Jan 25, 2026 | 6am - 4pm

PRODUCTION
• STM 01: 150 good / 1 scrap
  - EY1: N0102 Charge Barrel - 100 good
  - XY0: L0018 Pin Shaft - 50 good / 1 scrap (insert)
• STM 02: L0018 - 200 good / 0 scrap
• STM 03: (no production)
• STM 04: P0045 Pin Head - 85 good / 0 scrap

DOWNTIME
• STM 01: Flip machine - 30 min

OTHER ACTIVITIES
- None

NOTES
- None
```

---

## File Structure

```
/
├── convex/
│   ├── schema.ts
│   ├── users.ts
│   ├── reports.ts
│   ├── machines.ts
│   ├── downtime.ts
│   └── activities.ts
├── src/
│   ├── main.tsx
│   ├── App.tsx
│   ├── config.ts
│   ├── lib/
│   │   └── reportGenerator.ts
│   ├── components/
│   │   ├── WelcomeScreen.tsx
│   │   ├── ReportSetup.tsx
│   │   ├── CellDashboard.tsx
│   │   ├── MachineGrid.tsx
│   │   ├── MachineEntryModal.tsx
│   │   ├── BatchForm.tsx
│   │   ├── DowntimeTab.tsx
│   │   ├── ActivitiesTab.tsx
│   │   ├── NotesTab.tsx
│   │   ├── ReportPreview.tsx
│   │   └── ui/
│   └── hooks/
│       └── useCurrentReport.ts
├── index.html
├── package.json
├── tailwind.config.js
├── tsconfig.json
└── vite.config.ts
```

---

## Key Decisions

| Aspect | Decision |
|--------|----------|
| Auth | Simple name dropdown (no password) |
| Data | Convex normalized tables |
| UI | Industrial aesthetic, iPad-optimized |
| Report | Static plain text template |
| Shifts | 2 presets + custom entry |
| Parts | Free text with recent autocomplete |
| Batches | Optional, each has own part code |
| Scrap | Requires reason when qty > 0 |

---

## Out of Scope (MVP)

- Payroll/performance metrics
- Multi-department support
- Approval workflows
- Complex permissions
- Real-time collaboration
- Offline support
- AI report formatting

---

## Definition of Done

- Operator can complete a full daily report in under 2 minutes
- Report can be copied and pasted directly into WhatsApp
- Data is saved per user per day in Convex
- App works reliably on iPad
