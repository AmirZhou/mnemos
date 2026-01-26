import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import { Button, Select, NumberInput, Input } from "./ui";
import { ACTIVITY_TYPES } from "../config";

interface ActivitiesTabProps {
  reportId: Id<"dailyReports">;
}

export function ActivitiesTab({ reportId }: ActivitiesTabProps) {
  const activities = useQuery(api.activities.listForReport, { reportId });
  const addActivity = useMutation(api.activities.add);
  const removeActivity = useMutation(api.activities.remove);

  const [showForm, setShowForm] = useState(false);
  const [type, setType] = useState("");
  const [customType, setCustomType] = useState("");
  const [duration, setDuration] = useState<number | undefined>(undefined);
  const [notes, setNotes] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const typeOptions = ACTIVITY_TYPES.map((t) => ({ value: t, label: t }));

  const handleSave = async () => {
    if (!type) return;
    const finalType = type === "Other" ? customType : type;
    if (!finalType.trim()) return;

    setIsSaving(true);
    try {
      await addActivity({
        reportId,
        type: finalType,
        durationMinutes: duration,
        notes: notes.trim() || undefined,
      });
      setShowForm(false);
      setType("");
      setCustomType("");
      setDuration(undefined);
      setNotes("");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: Id<"activityEntries">) => {
    if (confirm("Delete this activity?")) {
      await removeActivity({ id });
    }
  };

  return (
    <div className="p-4 space-y-4">
      {/* Existing entries */}
      {activities && activities.length > 0 ? (
        <div className="space-y-3">
          {activities.map((entry) => (
            <div
              key={entry._id}
              className="p-4 bg-surface-700 rounded-lg flex items-center justify-between"
            >
              <div>
                <div className="font-medium text-gray-100">{entry.type}</div>
                <div className="text-sm text-gray-400">
                  {entry.durationMinutes && `${entry.durationMinutes} min`}
                  {entry.notes && (
                    <span className="ml-2">- {entry.notes}</span>
                  )}
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
          No other activities recorded
        </div>
      ) : null}

      {/* Add form */}
      {showForm ? (
        <div className="p-4 bg-surface-800 rounded-xl space-y-4">
          <h3 className="font-medium text-gray-200">Add Activity</h3>

          <Select
            label="Type"
            options={typeOptions}
            value={type}
            onChange={(e) => setType(e.target.value)}
            placeholder="Select activity..."
          />

          {type === "Other" && (
            <Input
              label="Custom Activity"
              placeholder="Describe the activity..."
              value={customType}
              onChange={(e) => setCustomType(e.target.value)}
            />
          )}

          <NumberInput
            label="Duration (minutes, optional)"
            value={duration ?? 0}
            onChange={(val) => setDuration(val || undefined)}
            min={0}
            step={15}
          />

          <Input
            label="Notes (optional)"
            placeholder="Additional details..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
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
              disabled={!type || (type === "Other" && !customType.trim()) || isSaving}
            >
              {isSaving ? "Saving..." : "Add"}
            </Button>
          </div>
        </div>
      ) : (
        <Button className="w-full" onClick={() => setShowForm(true)}>
          + Add Activity
        </Button>
      )}
    </div>
  );
}
