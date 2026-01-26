import { useState, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import { TextArea } from "./ui";

interface NotesTabProps {
  reportId: Id<"dailyReports">;
}

export function NotesTab({ reportId }: NotesTabProps) {
  const report = useQuery(api.reports.getFullReport, { reportId });
  const updateNotes = useMutation(api.reports.updateNotes);

  const [notes, setNotes] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (report) {
      setNotes(report.generalNotes || "");
    }
  }, [report]);

  // Debounced save
  useEffect(() => {
    if (report && notes !== report.generalNotes) {
      const timer = setTimeout(async () => {
        setIsSaving(true);
        try {
          await updateNotes({ reportId, generalNotes: notes });
        } finally {
          setIsSaving(false);
        }
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [notes, report, reportId, updateNotes]);

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-medium text-gray-200">General Notes</h3>
        {isSaving && (
          <span className="text-xs text-gray-400">Saving...</span>
        )}
      </div>

      <TextArea
        placeholder="Add any general notes about the shift..."
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        rows={6}
        className="min-h-[200px]"
      />

      <p className="text-xs text-gray-500">
        Notes auto-save as you type
      </p>
    </div>
  );
}
