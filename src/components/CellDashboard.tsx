import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import { Button } from "./ui";
import { MachineGrid } from "./MachineGrid";
import { MachineEntryModal } from "./MachineEntryModal";
import { DowntimeTab } from "./DowntimeTab";
import { ActivitiesTab } from "./ActivitiesTab";
import { NotesTab } from "./NotesTab";
import { ReportPreview } from "./ReportPreview";
import { getCellById } from "../config";
import { formatDateForDisplay } from "../lib/dateUtils";

type Tab = "machines" | "downtime" | "activities" | "notes";

interface CellDashboardProps {
  reportId: Id<"dailyReports">;
  userId: Id<"users">;
  onBack: () => void;
}

export function CellDashboard({ reportId, userId, onBack }: CellDashboardProps) {
  const report = useQuery(api.reports.getFullReport, { reportId });

  const [activeTab, setActiveTab] = useState<Tab>("machines");
  const [selectedMachine, setSelectedMachine] = useState<string | null>(null);
  const [showReportPreview, setShowReportPreview] = useState(false);

  if (!report) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface-900">
        <div className="text-gray-400">Loading...</div>
      </div>
    );
  }

  const cell = getCellById(report.cellId);
  const machines = cell?.machines ?? [];

  const tabs: { id: Tab; label: string }[] = [
    { id: "machines", label: "Machines" },
    { id: "downtime", label: "Downtime" },
    { id: "activities", label: "Activities" },
    { id: "notes", label: "Notes" },
  ];

  return (
    <div className="min-h-screen bg-surface-900 flex flex-col">
      {/* Header */}
      <header className="bg-surface-800 border-b border-surface-700 px-3 sm:px-4 py-2 sm:py-3">
        <div className="flex items-center justify-between gap-2">
          <div className="min-w-0 flex-1">
            <h1 className="text-lg sm:text-xl font-semibold text-gray-100 truncate">
              {cell?.name}
            </h1>
            <p className="text-xs sm:text-sm text-gray-400 truncate">
              {formatDateForDisplay(report.date)} | {report.shift}
            </p>
          </div>
          <div className="flex gap-1 sm:gap-2 shrink-0">
            <Button variant="ghost" size="sm" onClick={onBack} className="px-2 sm:px-3">
              Exit
            </Button>
            <Button size="sm" onClick={() => setShowReportPreview(true)} className="px-2 sm:px-3">
              Generate
            </Button>
          </div>
        </div>
      </header>

      {/* Tab bar */}
      <div className="bg-surface-800 border-b border-surface-700 px-1 sm:px-2">
        <div className="flex">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`
                flex-1 py-2 sm:py-3 px-2 sm:px-4 text-xs sm:text-sm font-medium transition-colors
                ${
                  activeTab === tab.id
                    ? "text-amber-400 border-b-2 border-amber-400"
                    : "text-gray-400 hover:text-gray-200"
                }
              `}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <main className="flex-1 overflow-y-auto">
        {activeTab === "machines" && (
          <MachineGrid
            reportId={reportId}
            machines={machines}
            onMachineClick={setSelectedMachine}
          />
        )}
        {activeTab === "downtime" && (
          <DowntimeTab reportId={reportId} cellId={report.cellId} />
        )}
        {activeTab === "activities" && (
          <ActivitiesTab reportId={reportId} />
        )}
        {activeTab === "notes" && (
          <NotesTab reportId={reportId} />
        )}
      </main>

      {/* Machine Entry Modal */}
      {selectedMachine && (
        <MachineEntryModal
          isOpen={true}
          onClose={() => setSelectedMachine(null)}
          machineId={selectedMachine}
          reportId={reportId}
          userId={userId}
        />
      )}

      {/* Report Preview Modal */}
      <ReportPreview
        isOpen={showReportPreview}
        onClose={() => setShowReportPreview(false)}
        reportId={reportId}
      />
    </div>
  );
}
