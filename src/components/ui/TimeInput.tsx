import { forwardRef } from "react";

interface TimeInputProps {
  label?: string;
  value: string;
  onChange: (value: string) => void;
  className?: string;
}

export const TimeInput = forwardRef<HTMLInputElement, TimeInputProps>(
  ({ label, value, onChange, className = "" }, ref) => {
    return (
      <div className={`w-full ${className}`}>
        {label && (
          <label className="block text-sm font-medium text-gray-400 mb-1.5">
            {label}
          </label>
        )}
        <input
          ref={ref}
          type="time"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="
            w-full px-4 py-3 bg-surface-700 border border-surface-600 rounded-lg
            text-gray-100 text-lg
            focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent
            transition-all duration-150
          "
        />
      </div>
    );
  }
);

TimeInput.displayName = "TimeInput";
