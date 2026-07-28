"use client";

import { useCallback, useId, useState } from "react";
import type { DateRange } from "@daypicker/react";
import CalendarIcon from "@/components/icons/CalendarIcon";
import DatePickerSheet from "./DatePickerSheet";
import { formatDateRange } from "./date-format";

export type DateInputProps = {
  id?: string;
  label?: string;
  value?: DateRange;
  onChange?: (value: DateRange) => void;
  placeholder?: string;
  helperMessage?: string;
  disabled?: boolean;
  required?: boolean;
  className?: string;
};

export default function DateInput({
  id,
  label,
  value,
  onChange,
  placeholder = "YYYY.MM.DD ~ YYYY.MM.DD",
  helperMessage = "",
  disabled = false,
  required = false,
  className = "",
}: DateInputProps) {
  const generatedId = useId();
  const inputId = id || generatedId;
  const [isOpen, setIsOpen] = useState(false);
  const [draftRange, setDraftRange] = useState<DateRange | undefined>(value);
  const displayValue = value?.from ? formatDateRange(value) : "";
  const closeCalendar = useCallback(() => setIsOpen(false), []);

  const openCalendar = () => {
    if (disabled) return;

    setDraftRange(value);
    setIsOpen(true);
  };

  const confirmRange = () => {
    if (!draftRange?.from) return;

    if (onChange) {
      onChange({
        from: draftRange.from,
        to: draftRange.to || draftRange.from,
      });
    }
    closeCalendar();
  };

  return (
    <>
      <div className={`flex w-full flex-col gap-2.5 ${className}`}>
        {label && (
          <label
            htmlFor={inputId}
            className="flex items-center gap-0.5 text-b2 font-semibold text-semantic-800"
          >
            {label}
            {required && <span className="text-red-400">*</span>}
          </label>
        )}

        <button
          disabled={disabled}
          className="
            flex h-14 w-full items-center justify-between rounded-btn
            border border-semantic-300 bg-semantic-100 px-5
            disabled:cursor-not-allowed
            disabled:border-semantic-400
            disabled:bg-semantic-300
        "
        >
          <span
            className={`text-b1 ${
              disabled
                ? "text-semantic-500"
                : displayValue
                  ? "text-semantic-800"
                  : "text-semantic-500"
            }`}
          >
            {displayValue || placeholder}
          </span>
          <CalendarIcon
            className={`size-6 shrink-0  ${disabled ? "text-semantic-500" : "text-semantic-700"} `}
          />
        </button>

        {helperMessage && (
          <p className="text-b3 text-semantic-600">{helperMessage}</p>
        )}
      </div>

      {isOpen && (
        <DatePickerSheet
          value={draftRange}
          onChange={setDraftRange}
          onCancel={closeCalendar}
          onConfirm={confirmRange}
        />
      )}
    </>
  );
}
