import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import { Button, Select, Input, TimeInput } from "./ui";
import { DOWNTIME_REASONS, getMachinesForCell } from "../config";

interface DowntimeTabProps {
  reportId: Id<"dailyReports">;
  cellId: number;
}

function calculateDuration(startTime: string, endTime: string): number {
  const [startH, startM] = startTime.split(":").map(Number);
  const [endH, endM] = endTime.split(":").map(Number);

  let startMinutes = startH * 60 + startM;
  let endMinutes = endH * 60 + endM;

  // Handle overnight (e.g., 23:00 to 01:00)
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

export function DowntimeTab({ reportId, cellId }: DowntimeTabProps) {
  const downtimeEntries = useQuery(api.downtime.listForReport, { reportId });
  const addDowntime = useMutation(api.downtime.add);
  const removeDowntime = useMutation(api.downtime.remove);

  const [showForm, setShowForm] = useState(false);
  const [machineId, setMachineId] = useState<string>("");
  const [reason, setReason] = useState("");
  const [customReason, setCustomReason] = useState("");
  const [startTime, setStartTime] = useState("08:00");
  const [endTime, setEndTime] = useState("08:30");
  const [isSaving, setIsSaving] = useState(false);

  const machines = getMachinesForCell(cellId);
  const machineOptions = [
    { value: "", label: "Cell (General)" },
    ...machines.map((m) => ({ value: m, label: m })),
  ];

  const reasonOptions = DOWNTIME_REASONS.map((r) => ({ value: r, label: r }));

  const handleSave = async () => {
    if (!reason) return;
    const finalReason = reason === "Other" ? customReason : reason;
    if (!finalReason.trim()) return;
    if (!startTime || !endTime) return;

    setIsSaving(true);
    try {
      await addDowntime({
        reportId,
        machineId: machineId || undefined,
        reason: finalReason,
        startTime,
        endTime,
      });
      setShowForm(false);
      setMachineId("");
      setReason("");
      setCustomReason("");
      setStartTime("08:00");
      setEndTime("08:30");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: Id<"downtimeEntries">) => {
    if (confirm("Delete this downtime entry?")) {
      await removeDowntime({ id });
    }
  };

  return (
    <div className="p-4 space-y-4">
      {/* Existing entries */}
      {downtimeEntries && downtimeEntries.length > 0 ? (
        <div className="space-y-3">
          {downtimeEntries.map((entry) => {
            // Handle both old (durationMinutes) and new (startTime/endTime) formats
            const hasTimeRange = entry.startTime && entry.endTime;
            const duration = hasTimeRange
              ? calculateDuration(entry.startTime!, entry.endTime!)
              : entry.durationMinutes ?? 0;

            return (
              <div
                key={entry._id}
                className="p-4 bg-surface-700 rounded-lg flex items-start justify-between gap-3"
              >
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-gray-100">
                    {entry.machineId || "Cell"}: {entry.reason}
                  </div>
                  <div className="text-sm text-gray-400 mt-1">
                    {hasTimeRange ? (
                      <>
                        <span className="font-mono">{entry.startTime}</span>
                        <span className="mx-2">→</span>
                        <span className="font-mono">{entry.endTime}</span>
                        <span className="ml-2 text-amber-400">({formatDuration(duration)})</span>
                      </>
                    ) : (
                      <span className="text-amber-400">{formatDuration(duration)}</span>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => handleDelete(entry._id)}
                  className="p-2 text-gray-400 hover:text-red-400 hover:bg-surface-600 rounded shrink-0"
                >
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                    />
                  </svg>
                </button>
              </div>
            );
          })}
        </div>
      ) : !showForm ? (
        <div className="text-center py-8 text-gray-400">
          No downtime recorded
        </div>
      ) : null}

      {/* Add form */}
      {showForm ? (
        <div className="p-4 bg-surface-800 rounded-xl space-y-4">
          <h3 className="font-medium text-gray-200">Add Downtime</h3>

          <Select
            label="Machine"
            options={machineOptions}
            value={machineId}
            onChange={(e) => setMachineId(e.target.value)}
          />

          <Select
            label="Reason"
            options={reasonOptions}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Select reason..."
          />

          {reason === "Other" && (
            <Input
              label="Custom Reason"
              placeholder="Describe the reason..."
              value={customReason}
              onChange={(e) => setCustomReason(e.target.value)}
            />
          )}

          <div className="grid grid-cols-2 gap-4">
            <TimeInput
              label="Start Time"
              value={startTime}
              onChange={setStartTime}
            />
            <TimeInput
              label="End Time"
              value={endTime}
              onChange={setEndTime}
            />
          </div>

          {startTime && endTime && (
            <div className="text-center text-sm text-amber-400">
              Duration: {formatDuration(calculateDuration(startTime, endTime))}
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <Button
              variant="ghost"
              className="flex-1"
              onClick={() => setShowForm(false)}
            >
              Cancel
            </Button>
            <Button
              className="flex-1"
              onClick={handleSave}
              disabled={!reason || (reason === "Other" && !customReason.trim()) || !startTime || !endTime || isSaving}
            >
              {isSaving ? "Saving..." : "Add"}
            </Button>
          </div>
        </div>
      ) : (
        <Button className="w-full" onClick={() => setShowForm(true)}>
          + Add Downtime
        </Button>
      )}
    </div>
  );
}
