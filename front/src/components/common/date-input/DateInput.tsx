"use client";

import { useRef, type ChangeEvent } from "react";
import { Calendar } from "lucide-react";
import Input, { type InputProps } from "@/components/common/input/Input";

type DateInputProps = Omit<
  InputProps,
  "type" | "value" | "onChange" | "rightIcon" | "rightAction"
> & {
  value: string;
  onChange: (value: string) => void;
};

export default function DateInput({
  value,
  onChange,
  disabled,
  className = "",
  ...props
}: DateInputProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    onChange(event.target.value);
  };

  const handleOpenCalendar = () => {
    if (disabled) return;

    const input = inputRef.current;
    if (!input) return;

    const showPicker = (
      input as HTMLInputElement & { showPicker?: () => void }
    ).showPicker;

    if (showPicker) {
      showPicker.call(input);
      return;
    }

    input.focus();
  };

  return (
    <Input
      {...props}
      ref={inputRef}
      type="date"
      value={value}
      disabled={disabled}
      onChange={handleChange}
      rightAction={{
        icon: <Calendar size={20} aria-hidden="true" />,
        label: "달력 열기",
        onClick: handleOpenCalendar,
      }}
      className={`[&::-webkit-calendar-picker-indicator]:opacity-0 ${className}`}
    />
  );
}
