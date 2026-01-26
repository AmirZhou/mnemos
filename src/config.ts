export const CELLS = [
  { id: 1, name: "Cell 1", machines: ["STM 01", "STM 02", "STM 03", "STM 04"] },
  { id: 2, name: "Cell 2", machines: ["STM 05", "STM 06", "STM 07", "STM 08"] },
  { id: 3, name: "Cell 3", machines: ["STM 09", "STM 10", "STM 11", "STM 12"] },
  { id: 4, name: "Cell 4", machines: ["STM 13", "STM 14", "STM 15", "STM 16"] },
] as const;

export const SHIFTS = [
  { label: "Day Shift", value: "6am - 4pm" },
  { label: "Evening Shift", value: "4pm - 2am" },
] as const;

export const DOWNTIME_REASONS = [
  "Waiting for material",
  "Machine down",
  "Tooling issue",
  "QC hold",
  "Flip machine",
  "Other",
] as const;

export const SCRAP_REASONS = [
  "Insert",
  "Tooling wear",
  "Material defect",
  "Setup scrap",
  "Other",
] as const;

export const ACTIVITY_TYPES = [
  "Forklift",
  "Material move",
  "Saw",
  "Helping other cell",
  "Training",
  "Cleanup",
  "Other",
] as const;

export function getCellById(id: number) {
  return CELLS.find((c) => c.id === id);
}

export function getMachinesForCell(cellId: number) {
  return getCellById(cellId)?.machines ?? [];
}
