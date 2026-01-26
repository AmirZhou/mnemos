import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id, Doc } from "../../convex/_generated/dataModel";
import { Button, Select, NumberInput, Input } from "./ui";
import { DOWNTIME_REASONS, getMachinesForCell } from "../config";

interface DowntimeTabProps {
  reportId: Id<"dailyReports">;
  cellId: number;
}

export function DowntimeTab({ reportId, cellId }: DowntimeTabProps) {
  const downtimeEntries = useQuery(api.downtime.listForReport, { reportId });
  const addDowntime = useMutation(api.downtime.add);
  const removeDowntime = useMutation(api.downtime.remove);

  const [showForm, setShowForm] = useState(false);
  const [machineId, setMachineId] = useState<string>("");
  const [reason, setReason] = useState("");
  const [customReason, setCustomReason] = useState("");
  const [duration, setDuration] = useState(30);
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

    setIsSaving(true);
    try {
      await addDowntime({
        reportId,
        machineId: machineId || undefined,
        reason: finalReason,
        durationMinutes: duration,
      });
      setShowForm(false);
      setMachineId("");
      setReason("");
      setCustomReason("");
      setDuration(30);
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
          {downtimeEntries.map((entry) => (
            <div
              key={entry._id}
              className="p-4 bg-surface-700 rounded-lg flex items-center justify-between"
            >
              <div>
                <div className="font-medium text-gray-100">
                  {entry.machineId || "Cell"}: {entry.reason}
                </div>
                <div className="text-sm text-gray-400">
                  {entry.durationMinutes} min
                </div>
              </div>
              <button
                onClick={() => handleDelete(entry._id)}
                className="p-2 text-gray-400 hover:text-red-400 hover:bg-surface-600 rounded"
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
          ))}
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

          <NumberInput
            label="Duration (minutes)"
            value={duration}
            onChange={setDuration}
            min={1}
            step={15}
          />

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
              disabled={!reason || (reason === "Other" && !customReason.trim()) || isSaving}
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
