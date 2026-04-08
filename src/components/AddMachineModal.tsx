import { useEffect, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import { Button, Input, Modal, TimeInput } from "./ui";

interface AddMachineModalProps {
  isOpen: boolean;
  onClose: () => void;
  reportId: Id<"dailyReports">;
  userId: Id<"users">;
}

export function AddMachineModal({
  isOpen,
  onClose,
  reportId,
  userId,
}: AddMachineModalProps) {
  const addMachine = useMutation(api.machines.addMachine);
  const recentMachines = useQuery(api.machines.getRecentForUser, { userId });
  const currentMachines = useQuery(api.machines.listForReport, { reportId });

  const [machineId, setMachineId] = useState("");
  const [jobNumber, setJobNumber] = useState("");
  const [description, setDescription] = useState("");
  const [hasTimeWindow, setHasTimeWindow] = useState(false);
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const reset = () => {
    setMachineId("");
    setJobNumber("");
    setDescription("");
    setHasTimeWindow(false);
    setStartTime("");
    setEndTime("");
    setIsSaving(false);
  };

  // Reset every time the modal reopens
  useEffect(() => {
    if (isOpen) reset();
  }, [isOpen]);

  // Auto-prefill sticky job/description when machineId matches a known recent
  useEffect(() => {
    if (!machineId.trim() || !recentMachines) return;
    const match = recentMachines.find(
      (m) => m.machineId.toLowerCase() === machineId.trim().toLowerCase()
    );
    if (match) {
      if (!jobNumber && match.lastJobNumber) setJobNumber(match.lastJobNumber);
      if (!description && match.lastDescription)
        setDescription(match.lastDescription);
    }
  }, [machineId, recentMachines]);

  const usedIds = new Set(currentMachines?.map((m) => m.machineId) ?? []);
  const chips = (recentMachines ?? [])
    .filter((m) => !usedIds.has(m.machineId))
    .slice(0, 8);

  const pickChip = (
    chip: NonNullable<typeof recentMachines>[number]
  ) => {
    setMachineId(chip.machineId);
    if (chip.lastJobNumber) setJobNumber(chip.lastJobNumber);
    if (chip.lastDescription) setDescription(chip.lastDescription);
  };

  const canSave =
    machineId.trim().length > 0 &&
    !usedIds.has(machineId.trim()) &&
    !isSaving;

  const handleSave = async () => {
    if (!canSave) return;
    setIsSaving(true);
    try {
      await addMachine({
        reportId,
        machineId: machineId.trim(),
        jobNumber: jobNumber.trim() || undefined,
        description: description.trim() || undefined,
        startTime: hasTimeWindow && startTime ? startTime : undefined,
        endTime: hasTimeWindow && endTime ? endTime : undefined,
      });
      onClose();
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Add Machine" size="md">
      <div className="space-y-4">
        <div>
          <Input
            label="Machine"
            placeholder="e.g., STM 21"
            value={machineId}
            onChange={(e) => setMachineId(e.target.value.toUpperCase())}
            autoFocus
          />
          {chips.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-2">
              {chips.map((chip) => (
                <button
                  key={chip._id}
                  type="button"
                  onClick={() => pickChip(chip)}
                  className="px-3 py-1 rounded-full bg-surface-700 hover:bg-surface-600 border border-surface-600 text-xs text-gray-300 font-mono"
                >
                  {chip.machineId}
                </button>
              ))}
            </div>
          )}
          {usedIds.has(machineId.trim()) && (
            <p className="mt-1 text-xs text-red-400">
              {machineId.trim()} is already on this report.
            </p>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Input
            label="Job number (optional)"
            placeholder="e.g., Z0001"
            value={jobNumber}
            onChange={(e) => setJobNumber(e.target.value)}
          />
          <Input
            label="Description (optional)"
            placeholder="e.g., Top Sub"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <label className="flex items-center gap-2 text-sm text-gray-300">
            <input
              type="checkbox"
              checked={hasTimeWindow}
              onChange={(e) => setHasTimeWindow(e.target.checked)}
              className="w-4 h-4 accent-amber-500"
            />
            Partial shift — set production time window
          </label>
          {hasTimeWindow && (
            <div className="grid grid-cols-2 gap-3">
              <TimeInput label="Start" value={startTime} onChange={setStartTime} />
              <TimeInput label="End" value={endTime} onChange={setEndTime} />
            </div>
          )}
        </div>

        <div className="flex gap-3 pt-4">
          <Button variant="ghost" className="flex-1" onClick={onClose}>
            Cancel
          </Button>
          <Button
            className="flex-1"
            onClick={handleSave}
            disabled={!canSave}
          >
            {isSaving ? "Adding..." : "Add Machine"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
