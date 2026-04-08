import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import { Modal, Button } from "./ui";
import { generateReportText } from "../lib/reportGenerator";

interface ReportPreviewProps {
  isOpen: boolean;
  onClose: () => void;
  reportId: Id<"dailyReports">;
}

export function ReportPreview({ isOpen, onClose, reportId }: ReportPreviewProps) {
  const report = useQuery(api.reports.getFullReport, { reportId });
  const [copied, setCopied] = useState(false);

  if (!report) {
    return (
      <Modal isOpen={isOpen} onClose={onClose} title="Report Preview" size="lg">
        <div className="text-center py-8 text-gray-400">Loading...</div>
      </Modal>
    );
  }

  const reportText = generateReportText(report);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(reportText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Report Preview" size="lg">
      <div className="space-y-4">
        {/* Preview */}
        <div className="bg-surface-900 rounded-lg p-4 font-mono text-sm whitespace-pre-wrap text-gray-300 max-h-[50vh] overflow-y-auto">
          {reportText}
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <Button variant="ghost" className="flex-1" onClick={onClose}>
            Close
          </Button>
          <Button
            className="flex-1"
            onClick={handleCopy}
          >
            {copied ? (
              <>
                <svg
                  className="w-5 h-5 mr-2 inline"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
                Copied!
              </>
            ) : (
              <>
                <svg
                  className="w-5 h-5 mr-2 inline"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                  />
                </svg>
                Copy to Clipboard
              </>
            )}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
