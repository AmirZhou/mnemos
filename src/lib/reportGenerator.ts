import { Doc, Id } from "../../convex/_generated/dataModel";

type BatchEntry = Doc<"batchEntries">;
type NoteEntry = Doc<"noteEntries">;

interface MachineWithBatches {
  _id: Id<"machineEntries">;
  machineId: string;
  jobNumber?: string;
  description?: string;
  startTime?: string;
  endTime?: string;
  order: number;
  batches: BatchEntry[];
}

interface FullReport {
  _id: Id<"dailyReports">;
  date: string;
  shift: string;
  area: string;
  machines: MachineWithBatches[];
  notes: NoteEntry[];
}

function formatDateLong(dateStr: string): string {
  const date = new Date(dateStr + "T00:00:00");
  return date.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

function formatTime12h(hhmm: string): string {
  const [h, m] = hhmm.split(":").map((s) => parseInt(s, 10));
  if (isNaN(h) || isNaN(m)) return hhmm;
  const suffix = h >= 12 ? "PM" : "AM";
  const hour12 = ((h + 11) % 12) + 1;
  return `${hour12}:${m.toString().padStart(2, "0")} ${suffix}`;
}

function pluralize(n: number, singular: string, plural: string): string {
  return n === 1 ? singular : plural;
}

function machineHeader(m: MachineWithBatches): string {
  const parts: string[] = [m.machineId];
  if (m.jobNumber) parts.push(`(${m.jobNumber})`);
  const head = parts.join(" ");
  if (m.description) return `${head} — ${m.description}`;
  return head;
}

function renderBatch(b: BatchEntry): string {
  const unit = pluralize(b.qty, "pc", "pcs");
  const base = `${b.partCode}: ${b.qty} ${unit}`;
  if (b.scrapQty && b.scrapQty > 0) {
    const scrapUnit = pluralize(b.scrapQty, "scrap", "scraps");
    return `${base} (${b.scrapQty} ${scrapUnit})`;
  }
  return base;
}

function renderMachineBlock(m: MachineWithBatches): string[] {
  const lines: string[] = [];
  lines.push(machineHeader(m));

  if (m.startTime && m.endTime) {
    lines.push(
      `Production time: ${formatTime12h(m.startTime)} – ${formatTime12h(m.endTime)}`
    );
  }

  for (const batch of m.batches) {
    lines.push(renderBatch(batch));
  }

  const total = m.batches.reduce((sum, b) => sum + b.qty, 0);
  if (m.batches.length > 0) {
    lines.push(`Total: ${total} ${pluralize(total, "pc", "pcs")}`);
  }

  return lines;
}

export function generateReportText(report: FullReport): string {
  const sections: string[][] = [];

  // Header
  sections.push([
    `Date: ${formatDateLong(report.date)}`,
    `Shift: ${report.shift}`,
    `Area: ${report.area}`,
  ]);

  // Production Summary
  const productionLines: string[] = ["Production Summary", ""];
  const machinesWithWork = report.machines.filter((m) => m.batches.length > 0);

  if (machinesWithWork.length === 0) {
    productionLines.push("_No production entered._");
  } else {
    machinesWithWork.forEach((m, idx) => {
      productionLines.push(...renderMachineBlock(m));
      if (idx < machinesWithWork.length - 1) productionLines.push("");
    });
  }
  sections.push(productionLines);

  // Operational Notes
  const operational = report.notes
    .filter((n) => n.category === "operational")
    .sort((a, b) => a.order - b.order);
  if (operational.length > 0) {
    const lines: string[] = ["Operational Notes", ""];
    operational.forEach((n, idx) => {
      if (n.title) lines.push(n.title);
      if (n.body) lines.push(n.body);
      if (idx < operational.length - 1) lines.push("");
    });
    sections.push(lines);
  }

  // Credit and Teamwork
  const credit = report.notes
    .filter((n) => n.category === "credit")
    .sort((a, b) => a.order - b.order);
  if (credit.length > 0) {
    const lines: string[] = ["Credit and Teamwork", ""];
    credit.forEach((n, idx) => {
      if (n.title) lines.push(n.title);
      if (n.body) lines.push(n.body);
      if (idx < credit.length - 1) lines.push("");
    });
    sections.push(lines);
  }

  return sections.map((s) => s.join("\n")).join("\n\n");
}
