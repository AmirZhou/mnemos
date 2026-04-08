import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import { Button } from "./ui";
import { MachineCard } from "./MachineCard";
import { AddMachineModal } from "./AddMachineModal";
import { NotesTab } from "./NotesTab";
import { ReportPreview } from "./ReportPreview";
import { formatDateForDisplay } from "../lib/dateUtils";

type Tab = "machines" | "notes";

interface ReportDashboardProps {
  reportId: Id<"dailyReports">;
  userId: Id<"users">;
  onBack: () => void;
}

export function ReportDashboard({
  reportId,
  userId,
  onBack,
}: ReportDashboardProps) {
  const report = useQuery(api.reports.getFullReport, { reportId });
  const machines = useQuery(api.machines.listForReport, { reportId });

  const [activeTab, setActiveTab] = useState<Tab>("machines");
  const [showAddMachine, setShowAddMachine] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  if (!report) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface-900">
        <div className="text-gray-400">Loading...</div>
      </div>
    );
  }

  const notesCount = report.notes?.length ?? 0;
  const machineCount = machines?.length ?? 0;

  const tabs: { id: Tab; label: string; count?: number }[] = [
    { id: "machines", label: "Machines", count: machineCount },
    { id: "notes", label: "Notes", count: notesCount },
  ];

  return (
    <div className="min-h-screen bg-surface-900 flex flex-col">
      {/* Header */}
      <header className="bg-surface-800 border-b border-surface-700 px-3 sm:px-4 py-2 sm:py-3">
        <div className="flex items-center justify-between gap-2">
          <div className="min-w-0 flex-1">
            <h1 className="text-lg sm:text-xl font-semibold text-gray-100 truncate">
              {report.area}
            </h1>
            <p className="text-xs sm:text-sm text-gray-400 truncate">
              {formatDateForDisplay(report.date)} | {report.shift}
            </p>
          </div>
          <div className="flex gap-1 sm:gap-2 shrink-0">
            <Button
              variant="ghost"
              size="sm"
              onClick={onBack}
              className="px-2 sm:px-3"
            >
              Exit
            </Button>
            <Button
              size="sm"
              onClick={() => setShowPreview(true)}
              className="px-2 sm:px-3"
            >
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
              {typeof tab.count === "number" && tab.count > 0 && (
                <span className="ml-1 text-gray-500">({tab.count})</span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <main className="flex-1 overflow-y-auto">
        {activeTab === "machines" && (
          <div className="p-3 sm:p-4 space-y-3">
            {machines === undefined ? (
              <div className="text-center py-12 text-gray-400">Loading...</div>
            ) : machines.length === 0 ? (
              <div className="text-center py-12 space-y-4">
                <p className="text-gray-400">No machines yet.</p>
                <Button onClick={() => setShowAddMachine(true)}>
                  + Add Machine
                </Button>
              </div>
            ) : (
              <>
                {machines.map((machine) => (
                  <MachineCard
                    key={machine._id}
                    machine={machine}
                    userId={userId}
                  />
                ))}
                <button
                  onClick={() => setShowAddMachine(true)}
                  className="w-full py-4 rounded-xl border-2 border-dashed border-surface-600 text-gray-400 hover:border-amber-500 hover:text-amber-400 transition-colors"
                >
                  + Add Machine
                </button>
              </>
            )}
          </div>
        )}

        {activeTab === "notes" && <NotesTab reportId={reportId} />}
      </main>

      {/* Add Machine Modal */}
      <AddMachineModal
        isOpen={showAddMachine}
        onClose={() => setShowAddMachine(false)}
        reportId={reportId}
        userId={userId}
      />

      {/* Report Preview Modal */}
      <ReportPreview
        isOpen={showPreview}
        onClose={() => setShowPreview(false)}
        reportId={reportId}
      />
    </div>
  );
}
