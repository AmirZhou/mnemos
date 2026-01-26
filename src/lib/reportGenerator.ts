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
  lines.push(`Setting Tools - Cell ${report.cellId}`);
  lines.push(`${formatDate(report.date)} | ${report.shift}`);
  lines.push("");

  // Production
  lines.push("PRODUCTION");

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

  for (const machineId of sortedMachineIds) {
    const machine = machineMap.get(machineId);

    if (!machine || machine.batches.length === 0) {
      lines.push(`• ${machineId}: (no production)`);
      continue;
    }

    const totalGood = sum(machine.batches, (b) => b.goodQty);
    const totalScrap = sum(machine.batches, (b) => b.scrapQty);
    const scrapSuffix = totalScrap > 0 ? ` / ${totalScrap} scrap` : "";
    lines.push(`• ${machineId}: ${totalGood} good${scrapSuffix}`);

    for (const batch of machine.batches) {
      const parts: string[] = [];

      // Batch number prefix
      if (batch.batchNumber) {
        parts.push(`${batch.batchNumber}:`);
      }

      // Part code and name
      const partLabel = batch.partName
        ? `${batch.partCode} ${batch.partName}`
        : batch.partCode;
      parts.push(partLabel);

      // Quantities
      parts.push(`- ${batch.goodQty} good`);
      if (batch.scrapQty > 0) {
        const reason = batch.scrapReason ? ` (${batch.scrapReason})` : "";
        parts.push(`/ ${batch.scrapQty} scrap${reason}`);
      }

      lines.push(`  - ${parts.join(" ")}`);
    }
  }

  lines.push("");

  // Downtime
  lines.push("DOWNTIME");
  if (report.downtime.length === 0) {
    lines.push("- None");
  } else {
    for (const d of report.downtime) {
      const location = d.machineId || "Cell";
      // Handle both old (durationMinutes) and new (startTime/endTime) formats
      if (d.startTime && d.endTime) {
        const duration = calculateDuration(d.startTime, d.endTime);
        lines.push(`• ${location}: ${d.reason} (${d.startTime} - ${d.endTime}, ${formatDuration(duration)})`);
      } else if (d.durationMinutes) {
        lines.push(`• ${location}: ${d.reason} - ${formatDuration(d.durationMinutes)}`);
      } else {
        lines.push(`• ${location}: ${d.reason}`);
      }
    }
  }
  lines.push("");

  // Other Activities
  lines.push("OTHER ACTIVITIES");
  if (report.activities.length === 0) {
    lines.push("- None");
  } else {
    for (const a of report.activities) {
      const parts: string[] = [a.type];
      if (a.durationMinutes) {
        parts.push(`- ${a.durationMinutes} min`);
      }
      if (a.notes) {
        parts.push(`(${a.notes})`);
      }
      lines.push(`• ${parts.join(" ")}`);
    }
  }
  lines.push("");

  // Notes
  lines.push("NOTES");
  lines.push(report.generalNotes?.trim() || "- None");

  return lines.join("\n");
}
