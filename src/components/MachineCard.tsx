import { useEffect, useState } from "react";
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Doc, Id } from "../../convex/_generated/dataModel";
import { Button, Input, Modal, TimeInput } from "./ui";
import { BatchForm } from "./BatchForm";

interface MachineWithBatches extends Doc<"machineEntries"> {
  batches: Doc<"batchEntries">[];
}

interface MachineCardProps {
  machine: MachineWithBatches;
  userId: Id<"users">;
}

export function MachineCard({ machine, userId }: MachineCardProps) {
  const updateMachine = useMutation(api.machines.updateMachine);
  const removeMachine = useMutation(api.machines.removeMachine);
  const deleteBatch = useMutation(api.machines.deleteBatch);

  const [editMeta, setEditMeta] = useState(false);
  const [jobNumber, setJobNumber] = useState(machine.jobNumber ?? "");
  const [description, setDescription] = useState(machine.description ?? "");
  const [startTime, setStartTime] = useState(machine.startTime ?? "");
  const [endTime, setEndTime] = useState(machine.endTime ?? "");
  const [hasTimeWindow, setHasTimeWindow] = useState(
    !!(machine.startTime && machine.endTime)
  );

  const [batchModalOpen, setBatchModalOpen] = useState(false);
  const [editingBatch, setEditingBatch] =
    useState<Doc<"batchEntries"> | null>(null);

  // Keep local meta state in sync when upstream doc changes
  useEffect(() => {
    if (!editMeta) {
      setJobNumber(machine.jobNumber ?? "");
      setDescription(machine.description ?? "");
      setStartTime(machine.startTime ?? "");
      setEndTime(machine.endTime ?? "");
      setHasTimeWindow(!!(machine.startTime && machine.endTime));
    }
  }, [
    machine.jobNumber,
    machine.description,
    machine.startTime,
    machine.endTime,
    editMeta,
  ]);

  const saveMeta = async () => {
    await updateMachine({
      machineEntryId: machine._id,
      jobNumber: jobNumber.trim() || undefined,
      description: description.trim() || undefined,
      startTime: hasTimeWindow ? startTime || undefined : undefined,
      endTime: hasTimeWindow ? endTime || undefined : undefined,
    });
    setEditMeta(false);
  };

  const cancelMeta = () => {
    setJobNumber(machine.jobNumber ?? "");
    setDescription(machine.description ?? "");
    setStartTime(machine.startTime ?? "");
    setEndTime(machine.endTime ?? "");
    setHasTimeWindow(!!(machine.startTime && machine.endTime));
    setEditMeta(false);
  };

  const handleRemoveMachine = async () => {
    if (
      confirm(
        `Remove ${machine.machineId} and all its parts from this report?`
      )
    ) {
      await removeMachine({ machineEntryId: machine._id });
    }
  };

  const handleDeleteBatch = async (batchId: Id<"batchEntries">) => {
    if (confirm("Delete this part entry?")) {
      await deleteBatch({ batchId });
    }
  };

  const totalQty = machine.batches.reduce((sum, b) => sum + b.qty, 0);
  const totalScrap = machine.batches.reduce(
    (sum, b) => sum + (b.scrapQty ?? 0),
    0
  );

  return (
    <div className="bg-surface-800 rounded-xl overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-surface-700 flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-baseline gap-2 flex-wrap">
            <h3 className="text-lg font-semibold text-gray-100 font-mono">
              {machine.machineId}
            </h3>
            {machine.jobNumber && (
              <span className="text-amber-400 font-mono text-sm">
                ({machine.jobNumber})
              </span>
            )}
            {machine.description && (
              <span className="text-gray-300 text-sm">
                — {machine.description}
              </span>
            )}
          </div>
          {machine.startTime && machine.endTime && (
            <p className="text-xs text-gray-400 mt-0.5">
              Production time: {machine.startTime} – {machine.endTime}
            </p>
          )}
        </div>
        <div className="flex gap-1 shrink-0">
          <button
            onClick={() => setEditMeta((v) => !v)}
            className="px-2 py-1 text-xs text-gray-400 hover:text-gray-200"
          >
            {editMeta ? "Close" : "Edit"}
          </button>
          <button
            onClick={handleRemoveMachine}
            className="px-2 py-1 text-xs text-gray-400 hover:text-red-400"
          >
            Remove
          </button>
        </div>
      </div>

      {/* Edit meta form */}
      {editMeta && (
        <div className="p-4 border-b border-surface-700 bg-surface-900/40 space-y-3">
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
                <TimeInput
                  label="Start"
                  value={startTime}
                  onChange={setStartTime}
                />
                <TimeInput
                  label="End"
                  value={endTime}
                  onChange={setEndTime}
                />
              </div>
            )}
          </div>

          <div className="flex gap-2 justify-end">
            <Button size="sm" variant="ghost" onClick={cancelMeta}>
              Cancel
            </Button>
            <Button size="sm" onClick={saveMeta}>
              Save
            </Button>
          </div>
        </div>
      )}

      {/* Parts list */}
      <div className="p-4 space-y-2">
        {machine.batches.length === 0 ? (
          <p className="text-sm text-gray-500 italic">No parts entered yet.</p>
        ) : (
          <>
            {machine.batches.map((batch) => (
              <div
                key={batch._id}
                className="flex items-center justify-between py-2 px-3 bg-surface-700 rounded-lg"
              >
                <div className="flex items-baseline gap-2 min-w-0">
                  <span className="font-mono font-medium text-gray-100">
                    {batch.partCode}:
                  </span>
                  <span className="text-gray-200">
                    {batch.qty} {batch.qty === 1 ? "pc" : "pcs"}
                  </span>
                  {batch.scrapQty && batch.scrapQty > 0 && (
                    <span className="text-red-400 text-sm">
                      ({batch.scrapQty}{" "}
                      {batch.scrapQty === 1 ? "scrap" : "scraps"})
                    </span>
                  )}
                </div>
                <div className="flex gap-1 shrink-0">
                  <button
                    onClick={() => {
                      setEditingBatch(batch);
                      setBatchModalOpen(true);
                    }}
                    className="px-2 py-1 text-xs text-gray-400 hover:text-gray-200"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDeleteBatch(batch._id)}
                    className="px-2 py-1 text-xs text-gray-400 hover:text-red-400"
                  >
                    ×
                  </button>
                </div>
              </div>
            ))}
            <div className="flex items-baseline justify-between px-3 pt-2 border-t border-surface-700">
              <span className="text-sm text-gray-400">Total</span>
              <span className="text-gray-100 font-medium">
                {totalQty} {totalQty === 1 ? "pc" : "pcs"}
                {totalScrap > 0 && (
                  <span className="text-red-400 text-sm ml-2">
                    ({totalScrap} scrap)
                  </span>
                )}
              </span>
            </div>
          </>
        )}
      </div>

      {/* Add part */}
      <div className="p-3 pt-0">
        <button
          onClick={() => {
            setEditingBatch(null);
            setBatchModalOpen(true);
          }}
          className="w-full py-2 rounded-lg border border-dashed border-surface-600 text-sm text-gray-400 hover:border-amber-500 hover:text-amber-400 transition-colors"
        >
          + Add Part
        </button>
      </div>

      {/* Batch form modal */}
      <Modal
        isOpen={batchModalOpen}
        onClose={() => {
          setBatchModalOpen(false);
          setEditingBatch(null);
        }}
        title={
          editingBatch
            ? `Edit part on ${machine.machineId}`
            : `Add part to ${machine.machineId}`
        }
        size="md"
      >
        <BatchForm
          userId={userId}
          machineEntryId={machine._id}
          editingBatch={editingBatch}
          onSave={() => {
            setBatchModalOpen(false);
            setEditingBatch(null);
          }}
          onCancel={() => {
            setBatchModalOpen(false);
            setEditingBatch(null);
          }}
        />
      </Modal>
    </div>
  );
}
