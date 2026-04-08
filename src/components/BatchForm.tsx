import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id, Doc } from "../../convex/_generated/dataModel";
import { Button, Input, NumberInput } from "./ui";

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

  const [partCode, setPartCode] = useState(editingBatch?.partCode ?? "");
  const [qty, setQty] = useState(editingBatch?.qty ?? 0);
  const [scrapQty, setScrapQty] = useState(editingBatch?.scrapQty ?? 0);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const suggestions = (recentParts ?? [])
    .filter(
      (p) =>
        partCode &&
        p.partCode.toLowerCase().includes(partCode.toLowerCase()) &&
        p.partCode !== partCode
    )
    .slice(0, 5);

  const canSave = partCode.trim().length > 0 && qty > 0 && !isSaving;

  const handleSave = async () => {
    if (!canSave) return;
    setIsSaving(true);
    try {
      const data = {
        partCode: partCode.trim().toUpperCase(),
        qty,
        scrapQty: scrapQty > 0 ? scrapQty : undefined,
      };

      if (editingBatch) {
        await updateBatch({ batchId: editingBatch._id, ...data });
      } else {
        await addBatch({ machineEntryId, ...data });
      }

      await recordPartUsage({ userId, partCode: data.partCode });
      onSave();
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Part Code with autocomplete */}
      <div className="relative">
        <Input
          label="Part Code"
          placeholder="e.g., XP1"
          value={partCode}
          onChange={(e) => {
            setPartCode(e.target.value.toUpperCase());
            setShowSuggestions(true);
          }}
          onFocus={() => setShowSuggestions(true)}
          onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
          autoFocus
        />
        {showSuggestions && suggestions.length > 0 && (
          <div className="absolute z-10 w-full mt-1 bg-surface-700 border border-surface-600 rounded-lg shadow-lg overflow-hidden">
            {suggestions.map((part) => (
              <button
                key={part._id}
                type="button"
                className="w-full px-4 py-2 text-left hover:bg-surface-600 transition-colors"
                onMouseDown={() => {
                  setPartCode(part.partCode);
                  setShowSuggestions(false);
                }}
              >
                <span className="font-mono text-amber-400">{part.partCode}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Quantities */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
        <NumberInput label="Pieces (total)" value={qty} onChange={setQty} min={0} />
        <NumberInput
          label="Of which scrap"
          value={scrapQty}
          onChange={setScrapQty}
          min={0}
          max={qty}
        />
      </div>
      <p className="text-xs text-gray-500 -mt-2">
        Pieces is the total you made. Scrap is how many of those were bad.
      </p>

      {/* Actions */}
      <div className="flex gap-3 pt-4">
        <Button variant="ghost" className="flex-1" onClick={onCancel}>
          Cancel
        </Button>
        <Button className="flex-1" onClick={handleSave} disabled={!canSave}>
          {isSaving ? "Saving..." : editingBatch ? "Update" : "Add"}
        </Button>
      </div>
    </div>
  );
}
