import { useEffect, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import { Button, Select, Input } from "./ui";
import { SHIFTS } from "../config";
import { getTodayString } from "../lib/dateUtils";

interface ReportSetupProps {
  userId: Id<"users">;
  onReportReady: (reportId: Id<"dailyReports">) => void;
  onBack: () => void;
}

export function ReportSetup({ userId, onReportReady, onBack }: ReportSetupProps) {
  const user = useQuery(api.users.get, { id: userId });
  const recentAreas = useQuery(api.areas.getRecentForUser, { userId });
  const createReport = useMutation(api.reports.create);

  const [date, setDate] = useState(getTodayString());
  const [area, setArea] = useState("");
  const [areaSeeded, setAreaSeeded] = useState(false);
  const [shift, setShift] = useState<string>(SHIFTS[0].value);
  const [customShift, setCustomShift] = useState("");
  const [isCustomShift, setIsCustomShift] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  // Seed area once from user default or most-recent area
  useEffect(() => {
    if (areaSeeded || area !== "") return;
    const seed = user?.defaultArea || recentAreas?.[0]?.area;
    if (seed) {
      setArea(seed);
      setAreaSeeded(true);
    }
  }, [user?.defaultArea, recentAreas, area, areaSeeded]);

  const reportForDate = useQuery(api.reports.getByUserAndDate, {
    userId,
    date,
  });

  const effectiveShift = isCustomShift ? customShift.trim() : shift;
  const canContinue =
    area.trim().length > 0 && effectiveShift.length > 0 && !isCreating;

  const handleContinue = async () => {
    if (reportForDate) {
      onReportReady(reportForDate._id);
      return;
    }

    setIsCreating(true);
    try {
      const reportId = await createReport({
        date,
        userId,
        shift: effectiveShift,
        area: area.trim(),
      });
      onReportReady(reportId);
    } finally {
      setIsCreating(false);
    }
  };

  const shiftOptions = [
    ...SHIFTS.map((s) => ({ value: s.value, label: s.label })),
    { value: "__custom__", label: "Custom..." },
  ];

  const areaChips = (recentAreas ?? [])
    .slice(0, 5)
    .filter((a) => a.area !== area);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 sm:p-6 bg-surface-900">
      <div className="w-full max-w-md space-y-6 sm:space-y-8">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-bold text-gray-100">
            {user?.name ? `Hi, ${user.name}` : "Report Setup"}
          </h1>
          <p className="text-gray-400">Configure your daily report</p>
        </div>

        {/* Setup Card */}
        <div className="bg-surface-800 rounded-2xl p-6 space-y-5 shadow-xl">
          {/* Date */}
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1.5">
              Date
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full px-4 py-3 bg-surface-700 border border-surface-600 rounded-lg text-gray-100 focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
            {reportForDate && (
              <p className="mt-2 text-sm text-amber-400">
                Report exists for this date — will continue editing
              </p>
            )}
          </div>

          {/* Area */}
          <div>
            <Input
              label="Area"
              placeholder="e.g., Setting Tools – Gun Side"
              value={area}
              onChange={(e) => setArea(e.target.value)}
            />
            {areaChips.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-2">
                {areaChips.map((a) => (
                  <button
                    key={a._id}
                    type="button"
                    onClick={() => setArea(a.area)}
                    className="px-3 py-1 rounded-full bg-surface-700 hover:bg-surface-600 border border-surface-600 text-xs text-gray-300"
                  >
                    {a.area}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Shift */}
          <div className="space-y-3">
            <Select
              label="Shift"
              options={shiftOptions}
              value={isCustomShift ? "__custom__" : shift}
              onChange={(e) => {
                if (e.target.value === "__custom__") {
                  setIsCustomShift(true);
                } else {
                  setIsCustomShift(false);
                  setShift(e.target.value);
                }
              }}
            />
            {isCustomShift && (
              <Input
                placeholder="e.g., 4:00 PM – 2:00 AM"
                value={customShift}
                onChange={(e) => setCustomShift(e.target.value)}
                autoFocus
              />
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <Button variant="ghost" className="flex-1" onClick={onBack}>
              Back
            </Button>
            <Button
              className="flex-1"
              onClick={handleContinue}
              disabled={!canContinue}
            >
              {isCreating
                ? "Creating..."
                : reportForDate
                ? "Continue Report"
                : "Start Report"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
