import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id, Doc } from "../../convex/_generated/dataModel";
import { Modal, Button } from "./ui";
import { BatchForm } from "./BatchForm";

interface MachineEntryModalProps {
  isOpen: boolean;
  onClose: () => void;
  machineId: string;
  reportId: Id<"dailyReports">;
  userId: Id<"users">;
}

export function MachineEntryModal({
  isOpen,
  onClose,
  machineId,
  reportId,
  userId,
}: MachineEntryModalProps) {
  const getOrCreateEntry = useMutation(api.machines.getOrCreateMachineEntry);
  const deleteBatch = useMutation(api.machines.deleteBatch);
  const machineEntries = useQuery(api.machines.getMachineEntriesForReport, {
    reportId,
  });

  const [machineEntryId, setMachineEntryId] = useState<Id<"machineEntries"> | null>(null);
  const [showBatchForm, setShowBatchForm] = useState(false);
  const [editingBatch, setEditingBatch] = useState<Doc<"batchEntries"> | null>(null);

  // Get current machine entry
  const currentEntry = machineEntries?.find((e) => e.machineId === machineId);

  const handleAddBatch = async () => {
    let entryId = currentEntry?._id;
    if (!entryId) {
      entryId = await getOrCreateEntry({ reportId, machineId });
    }
    setMachineEntryId(entryId);
    setEditingBatch(null);
    setShowBatchForm(true);
  };

  const handleEditBatch = (batch: Doc<"batchEntries">) => {
    setMachineEntryId(currentEntry!._id);
    setEditingBatch(batch);
    setShowBatchForm(true);
  };

  const handleDeleteBatch = async (batchId: Id<"batchEntries">) => {
    if (confirm("Delete this batch?")) {
      await deleteBatch({ batchId });
    }
  };

  const handleBatchSaved = () => {
    setShowBatchForm(false);
    setEditingBatch(null);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={machineId} size="lg">
      {showBatchForm && machineEntryId ? (
        <BatchForm
          userId={userId}
          machineEntryId={machineEntryId}
          editingBatch={editingBatch}
          onSave={handleBatchSaved}
          onCancel={() => {
            setShowBatchForm(false);
            setEditingBatch(null);
          }}
        />
      ) : (
        <div className="space-y-4">
          {/* Existing batches */}
          {currentEntry && currentEntry.batches.length > 0 ? (
            <div className="space-y-3">
              <h3 className="text-sm font-medium text-gray-400">Batches</h3>
              {currentEntry.batches.map((batch) => (
                <div
                  key={batch._id}
                  className="p-4 bg-surface-700 rounded-lg space-y-2"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      {batch.batchNumber && (
                        <span className="text-amber-400 font-mono mr-2">
                          [{batch.batchNumber}]
                        </span>
                      )}
                      <span className="font-mono font-medium text-gray-100">
                        {batch.partCode}
                      </span>
                      {batch.partName && (
                        <span className="text-gray-400 ml-2">
                          {batch.partName}
                        </span>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEditBatch(batch)}
                        className="p-1.5 text-gray-400 hover:text-gray-200 hover:bg-surface-600 rounded"
                      >
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                          />
                        </svg>
                      </button>
                      <button
                        onClick={() => handleDeleteBatch(batch._id)}
                        className="p-1.5 text-gray-400 hover:text-red-400 hover:bg-surface-600 rounded"
                      >
                        <svg
                          className="w-4 h-4"
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
                  </div>
                  <div className="text-sm">
                    <span className="text-green-400">{batch.goodQty} good</span>
                    {batch.scrapQty > 0 && (
                      <span className="text-red-400 ml-2">
                        / {batch.scrapQty} scrap ({batch.scrapReason})
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-400">
              No batches entered yet
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <Button variant="ghost" className="flex-1" onClick={onClose}>
              Close
            </Button>
            <Button className="flex-1" onClick={handleAddBatch}>
              + Add Batch
            </Button>
          </div>
        </div>
      )}
    </Modal>
  );
}
