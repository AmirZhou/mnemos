import { useState, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id, Doc } from "../../convex/_generated/dataModel";
import { Button, Input, NumberInput, Select } from "./ui";
import { SCRAP_REASONS } from "../config";

interface BatchFormProps {
  userId: Id<"users">;
  machineEntryId: Id<"machineEntries">;
  editingBatch?: Doc<"batchEntries"> | null;
  onSave: () => void;
  onCancel: () => void;
}

export function BatchForm({
  userId,
  machineEntryId,
  editingBatch,
  onSave,
  onCancel,
}: BatchFormProps) {
  const addBatch = useMutation(api.machines.addBatch);
  const updateBatch = useMutation(api.machines.updateBatch);
  const recordPartUsage = useMutation(api.parts.recordUsage);
  const recentParts = useQuery(api.parts.getRecentForUser, { userId });

  const [batchNumber, setBatchNumber] = useState(editingBatch?.batchNumber ?? "");
  const [partCode, setPartCode] = useState(editingBatch?.partCode ?? "");
  const [partName, setPartName] = useState(editingBatch?.partName ?? "");
  const [goodQty, setGoodQty] = useState(editingBatch?.goodQty ?? 0);
  const [scrapQty, setScrapQty] = useState(editingBatch?.scrapQty ?? 0);
  const [scrapReason, setScrapReason] = useState(editingBatch?.scrapReason ?? "");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Filter suggestions based on input
  const suggestions = recentParts
    ?.filter(
      (p) =>
        partCode &&
        p.partCode.toLowerCase().includes(partCode.toLowerCase()) &&
        p.partCode !== partCode
    )
    .sort((a, b) => b.lastUsed - a.lastUsed)
    .slice(0, 5);

  const handleSelectSuggestion = (part: { partCode: string; partName?: string }) => {
    setPartCode(part.partCode);
    if (part.partName) setPartName(part.partName);
    setShowSuggestions(false);
  };

  const handleSave = async () => {
    if (!partCode.trim()) return;
    if (scrapQty > 0 && !scrapReason) return;

    setIsSaving(true);
    try {
      const data = {
        batchNumber: batchNumber.trim() || undefined,
        partCode: partCode.trim(),
        partName: partName.trim() || undefined,
        goodQty,
        scrapQty,
        scrapReason: scrapQty > 0 ? scrapReason : undefined,
      };

      if (editingBatch) {
        await updateBatch({ batchId: editingBatch._id, ...data });
      } else {
        await addBatch({ machineEntryId, ...data });
      }

      // Record part usage for autocomplete
      await recordPartUsage({
        userId,
        partCode: partCode.trim(),
        partName: partName.trim() || undefined,
      });

      onSave();
    } finally {
      setIsSaving(false);
    }
  };

  const scrapReasonOptions = SCRAP_REASONS.map((r) => ({
    value: r,
    label: r,
  }));

  return (
    <div className="space-y-4">
      {/* Batch Number */}
      <Input
        label="Batch Number (optional)"
        placeholder="e.g., EY1, XY0"
        value={batchNumber}
        onChange={(e) => setBatchNumber(e.target.value.toUpperCase())}
        maxLength={3}
      />

      {/* Part Code with autocomplete */}
      <div className="relative">
        <Input
          label="Part Code *"
          placeholder="e.g., N0102"
          value={partCode}
          onChange={(e) => {
            setPartCode(e.target.value.toUpperCase());
            setShowSuggestions(true);
          }}
          onFocus={() => setShowSuggestions(true)}
          onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
        />
        {showSuggestions && suggestions && suggestions.length > 0 && (
          <div className="absolute z-10 w-full mt-1 bg-surface-700 border border-surface-600 rounded-lg shadow-lg overflow-hidden">
            {suggestions.map((part) => (
              <button
                key={part._id}
                type="button"
                className="w-full px-4 py-2 text-left hover:bg-surface-600 transition-colors"
                onMouseDown={() => handleSelectSuggestion(part)}
              >
                <span className="font-mono text-amber-400">{part.partCode}</span>
                {part.partName && (
                  <span className="text-gray-400 ml-2">{part.partName}</span>
                )}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Part Name */}
      <Input
        label="Part Name (optional)"
        placeholder="e.g., Charge Barrel"
        value={partName}
        onChange={(e) => setPartName(e.target.value)}
      />

      {/* Quantities */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
        <NumberInput
          label="Good Qty *"
          value={goodQty}
          onChange={setGoodQty}
          min={0}
        />
        <NumberInput
          label="Scrap Qty"
          value={scrapQty}
          onChange={setScrapQty}
          min={0}
        />
      </div>

      {/* Scrap Reason (required if scrap > 0) */}
      {scrapQty > 0 && (
        <Select
          label="Scrap Reason *"
          options={scrapReasonOptions}
          value={scrapReason}
          onChange={(e) => setScrapReason(e.target.value)}
          placeholder="Select reason..."
        />
      )}

      {/* Actions */}
      <div className="flex gap-3 pt-4">
        <Button variant="ghost" className="flex-1" onClick={onCancel}>
          Cancel
        </Button>
        <Button
          className="flex-1"
          onClick={handleSave}
          disabled={
            !partCode.trim() || (scrapQty > 0 && !scrapReason) || isSaving
          }
        >
          {isSaving ? "Saving..." : editingBatch ? "Update" : "Add Batch"}
        </Button>
      </div>
    </div>
  );
}
