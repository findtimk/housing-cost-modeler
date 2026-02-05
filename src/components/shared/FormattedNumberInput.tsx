import { useState, useRef, useEffect } from 'react';

interface FormattedNumberInputProps {
  value: number;
  onChange: (v: number) => void;
  prefix?: string;
  suffix?: string;
  min?: number;
  max?: number;
  className?: string;
}

function formatWithCommas(num: number): string {
  return new Intl.NumberFormat('en-US').format(Math.round(num));
}

function parseNumber(str: string): number {
  const cleaned = str.replace(/[^0-9.-]/g, '');
  const parsed = parseFloat(cleaned);
  return isNaN(parsed) ? 0 : parsed;
}

export function FormattedNumberInput({
  value,
  onChange,
  prefix,
  suffix,
  min,
  max,
  className,
}: FormattedNumberInputProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [displayValue, setDisplayValue] = useState(formatWithCommas(value));
  const [isFocused, setIsFocused] = useState(false);

  // Sync display when value prop changes (and not focused)
  useEffect(() => {
    if (!isFocused) {
      setDisplayValue(formatWithCommas(value));
    }
  }, [value, isFocused]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target;
    const rawValue = input.value;
    const cursorPos = input.selectionStart ?? 0;

    // Count commas before cursor in old value
    const oldCommasBefore = (displayValue.slice(0, cursorPos).match(/,/g) || []).length;

    // Parse and clamp new value
    const numericValue = parseNumber(rawValue);
    const clampedValue = Math.max(min ?? -Infinity, Math.min(max ?? Infinity, numericValue));
    const newDisplay = formatWithCommas(clampedValue);

    // Count commas before same position in new value
    const newCommasBefore = (newDisplay.slice(0, cursorPos).match(/,/g) || []).length;

    // Adjust cursor for comma difference
    const newCursorPos = Math.max(0, cursorPos + (newCommasBefore - oldCommasBefore));

    setDisplayValue(newDisplay);
    onChange(clampedValue);

    // Restore cursor position after React re-render
    requestAnimationFrame(() => {
      if (inputRef.current) {
        inputRef.current.setSelectionRange(newCursorPos, newCursorPos);
      }
    });
  };

  const handleFocus = () => setIsFocused(true);
  const handleBlur = () => {
    setIsFocused(false);
    setDisplayValue(formatWithCommas(value));
  };

  return (
    <div className="flex items-center gap-1">
      {prefix && <span className="text-gray-500 text-xs">{prefix}</span>}
      <input
        ref={inputRef}
        type="text"
        inputMode="numeric"
        className={className ?? 'w-full border border-gray-300 rounded px-2 py-2 text-sm min-h-[44px]'}
        value={displayValue}
        onChange={handleChange}
        onFocus={handleFocus}
        onBlur={handleBlur}
      />
      {suffix && <span className="text-gray-500 text-xs">{suffix}</span>}
    </div>
  );
}
