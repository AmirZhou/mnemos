import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";

interface MachineGridProps {
  reportId: Id<"dailyReports">;
  machines: string[];
  onMachineClick: (machineId: string) => void;
}

export function MachineGrid({ reportId, machines, onMachineClick }: MachineGridProps) {
  const machineEntries = useQuery(api.machines.getMachineEntriesForReport, {
    reportId,
  });

  const getMachineStatus = (machineId: string) => {
    const entry = machineEntries?.find((e) => e.machineId === machineId);
    if (!entry || entry.batches.length === 0) return "empty";

    const totalGood = entry.batches.reduce((sum, b) => sum + b.goodQty, 0);
    const totalScrap = entry.batches.reduce((sum, b) => sum + b.scrapQty, 0);

    return { totalGood, totalScrap, batchCount: entry.batches.length };
  };

  return (
    <div className="grid grid-cols-2 gap-4 p-4">
      {machines.map((machineId) => {
        const status = getMachineStatus(machineId);
        const hasData = status !== "empty";

        return (
          <button
            key={machineId}
            onClick={() => onMachineClick(machineId)}
            className={`
              relative p-6 rounded-xl transition-all duration-150
              active:scale-[0.98] min-h-[120px]
              flex flex-col items-center justify-center gap-2
              ${
                hasData
                  ? "bg-amber-500/20 border-2 border-amber-500/50 hover:border-amber-400"
                  : "bg-surface-700 border-2 border-surface-600 hover:border-surface-500"
              }
            `}
          >
            {/* Machine ID */}
            <span className="font-mono text-2xl font-semibold text-gray-100">
              {machineId}
            </span>

            {/* Status indicator */}
            {hasData && typeof status === "object" ? (
              <div className="text-center">
                <div className="text-amber-400 font-medium">
                  {status.totalGood} good
                  {status.totalScrap > 0 && (
                    <span className="text-red-400 ml-1">
                      / {status.totalScrap} scrap
                    </span>
                  )}
                </div>
                <div className="text-xs text-gray-400 mt-1">
                  {status.batchCount} batch{status.batchCount !== 1 ? "es" : ""}
                </div>
              </div>
            ) : (
              <span className="text-gray-500 text-sm">Tap to enter</span>
            )}

            {/* Status dot */}
            <div
              className={`
                absolute top-3 right-3 w-3 h-3 rounded-full
                ${hasData ? "bg-amber-400" : "bg-surface-500"}
              `}
            />
          </button>
        );
      })}
    </div>
  );
}
