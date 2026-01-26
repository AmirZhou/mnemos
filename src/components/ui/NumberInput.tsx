import { forwardRef, useState } from "react";

interface NumberInputProps {
  label?: string;
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  className?: string;
}

export const NumberInput = forwardRef<HTMLInputElement, NumberInputProps>(
  ({ label, value, onChange, min = 0, max = 99999, step = 1, className = "" }, ref) => {
    const [localValue, setLocalValue] = useState(value.toString());

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const val = e.target.value;
      setLocalValue(val);

      const num = parseInt(val, 10);
      if (!isNaN(num) && num >= min && num <= max) {
        onChange(num);
      }
    };

    const handleBlur = () => {
      const num = parseInt(localValue, 10);
      if (isNaN(num) || num < min) {
        setLocalValue(min.toString());
        onChange(min);
      } else if (num > max) {
        setLocalValue(max.toString());
        onChange(max);
      } else {
        setLocalValue(num.toString());
        onChange(num);
      }
    };

    const increment = () => {
      const newVal = Math.min(value + step, max);
      setLocalValue(newVal.toString());
      onChange(newVal);
    };

    const decrement = () => {
      const newVal = Math.max(value - step, min);
      setLocalValue(newVal.toString());
      onChange(newVal);
    };

    return (
      <div className={`w-full ${className}`}>
        {label && (
          <label className="block text-sm font-medium text-gray-400 mb-1.5">
            {label}
          </label>
        )}
        <div className="flex items-stretch">
          <button
            type="button"
            onClick={decrement}
            className="px-4 bg-surface-600 hover:bg-surface-500 text-gray-200 rounded-l-lg transition-colors text-xl font-medium"
          >
            -
          </button>
          <input
            ref={ref}
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            value={localValue}
            onChange={handleChange}
            onBlur={handleBlur}
            className="
              flex-1 px-4 py-3 bg-surface-700 border-y border-surface-600
              text-gray-100 text-center font-mono text-lg
              focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent
              min-w-0
            "
          />
          <button
            type="button"
            onClick={increment}
            className="px-4 bg-surface-600 hover:bg-surface-500 text-gray-200 rounded-r-lg transition-colors text-xl font-medium"
          >
            +
          </button>
        </div>
      </div>
    );
  }
);

NumberInput.displayName = "NumberInput";
