import { Doc, Id } from "../../convex/_generated/dataModel";

type BatchEntry = Doc<"batchEntries">;
type DowntimeEntry = Doc<"downtimeEntries">;
type ActivityEntry = Doc<"activityEntries">;

function calculateDuration(startTime: string, endTime: string): number {
  const [startH, startM] = startTime.split(":").map(Number);
  const [endH, endM] = endTime.split(":").map(Number);

  let startMinutes = startH * 60 + startM;
  let endMinutes = endH * 60 + endM;

  if (endMinutes < startMinutes) {
    endMinutes += 24 * 60;
  }

  return endMinutes - startMinutes;
}

function formatDuration(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hours > 0 && mins > 0) {
    return `${hours}h ${mins}m`;
  } else if (hours > 0) {
    return `${hours}h`;
  }
  return `${mins}m`;
}

interface MachineWithBatches {
  _id: Id<"machineEntries">;
  machineId: string;
  batches: BatchEntry[];
}

interface FullReport {
  _id: Id<"dailyReports">;
  date: string;
  cellId: number;
  shift: string;
  generalNotes: string;
  machines: MachineWithBatches[];
  downtime: DowntimeEntry[];
  activities: ActivityEntry[];
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr + "T00:00:00");
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function sum<T>(arr: T[], fn: (item: T) => number): number {
  return arr.reduce((acc, item) => acc + fn(item), 0);
}

function sortMachines(machines: MachineWithBatches[]): MachineWithBatches[] {
  return [...machines].sort((a, b) => {
    const numA = parseInt(a.machineId.replace(/\D/g, ""));
    const numB = parseInt(b.machineId.replace(/\D/g, ""));
    return numA - numB;
  });
}

export function generateReportText(
  report: FullReport,
  allMachineIds: string[]
): string {
  const lines: string[] = [];

  // Header
  lines.push(`*Setting Tools - Cell ${report.cellId}*`);
  lines.push(`${formatDate(report.date)} | ${report.shift}`);
  lines.push("");

  // Production
  lines.push("*PRODUCTION*");

  // Create a map of machine entries
  const machineMap = new Map<string, MachineWithBatches>();
  for (const m of report.machines) {
    machineMap.set(m.machineId, m);
  }

  // Sort all machines in order
  const sortedMachineIds = [...allMachineIds].sort((a, b) => {
    const numA = parseInt(a.replace(/\D/g, ""));
    const numB = parseInt(b.replace(/\D/g, ""));
    return numA - numB;
  });

  // Collect batch info grouped by machine
  const batchInfoByMachine = new Map<string, { batchNumber: string; goodQty: number }[]>();

  for (const machineId of sortedMachineIds) {
    const machine = machineMap.get(machineId);

    if (!machine || machine.batches.length === 0) {
      lines.push(`• ${machineId}: _(no production)_`);
      lines.push("");
      continue;
    }

    lines.push(`• ${machineId}:`);

    // Group batches by part code and consolidate quantities
    const partCodeTotals = new Map<string, { goodQty: number; scrapQty: number }>();
    for (const batch of machine.batches) {
      // Collect batch info for later
      if (batch.batchNumber) {
        const existing = batchInfoByMachine.get(machineId) || [];
        existing.push({ batchNumber: batch.batchNumber, goodQty: batch.goodQty });
        batchInfoByMachine.set(machineId, existing);
      }

      // Consolidate by part code
      const existing = partCodeTotals.get(batch.partCode) || { goodQty: 0, scrapQty: 0 };
      existing.goodQty += batch.goodQty;
      existing.scrapQty += batch.scrapQty;
      partCodeTotals.set(batch.partCode, existing);
    }

    // Output consolidated lines
    for (const [partCode, totals] of partCodeTotals) {
      const qtyText = totals.scrapQty > 0
        ? `${totals.goodQty} good / ${totals.scrapQty} scrap`
        : `${totals.goodQty} good`;
      lines.push(`  - ${partCode} - ${qtyText}`);
    }

    // Add spacing between machines
    lines.push("");
  }

  // Downtime - only include if there is any
  if (report.downtime.length > 0) {
    lines.push("*DOWNTIME*");
    for (const d of report.downtime) {
      const location = d.machineId || "Cell";
      // Handle both old (durationMinutes) and new (startTime/endTime) formats
      if (d.startTime && d.endTime) {
        const duration = calculateDuration(d.startTime, d.endTime);
        lines.push(`- ${location}: ${d.reason} (${d.startTime} - ${d.endTime}, _${formatDuration(duration)}_)`);
      } else if (d.durationMinutes) {
        lines.push(`- ${location}: ${d.reason} - _${formatDuration(d.durationMinutes)}_`);
      } else {
        lines.push(`- ${location}: ${d.reason}`);
      }
    }
    lines.push("");
  }

  // Other Activities - only include if there is any
  if (report.activities.length > 0) {
    lines.push("*OTHER ACTIVITIES*");
    for (const a of report.activities) {
      const parts: string[] = [a.type];
      if (a.durationMinutes) {
        parts.push(`- _${a.durationMinutes} min_`);
      }
      if (a.notes) {
        parts.push(`_(${a.notes})_`);
      }
      lines.push(`- ${parts.join(" ")}`);
    }
    lines.push("");
  }

  // Notes - only include if there are any
  const notesContent = report.generalNotes?.trim();
  if (notesContent) {
    lines.push("*NOTES*");
    lines.push(notesContent);
    lines.push("");
  }

  // Batch info - subtle format at the bottom, only if there are batches
  if (batchInfoByMachine.size > 0) {
    const batchLines: string[] = [];
    for (const [machineId, batches] of batchInfoByMachine) {
      const batchStr = batches.map(b => `${b.batchNumber} (${b.goodQty})`).join(", ");
      batchLines.push(`${machineId}: ${batchStr}`);
    }
    lines.push(`_Batch: ${batchLines.join(" | ")}_`);
  }

  return lines.join("\n");
}
