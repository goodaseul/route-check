"use client";

import { useEffect } from "react";
import { DayPicker, type DateRange } from "@daypicker/react";
import { ko } from "@daypicker/react/locale";
import "@daypicker/react/style.css";
import Button from "@/components/common/buttons/Button";
import { showToast } from "@/lib/utils/toast";
import { getInclusiveDayCount } from "./date-format";
import styles from "./DateInput.module.css";

const MAX_TRIP_DAYS = 5;

type DatePickerSheetProps = {
  value?: DateRange;
  onChange: (value: DateRange | undefined) => void;
  onCancel: () => void;
  onConfirm: () => void;
};

export default function DatePickerSheet({
  value,
  onChange,
  onCancel,
  onConfirm,
}: DatePickerSheetProps) {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onCancel();
    };

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [onCancel]);

  const handleSelect = (nextRange: DateRange | undefined) => {
    if (nextRange && getInclusiveDayCount(nextRange) > MAX_TRIP_DAYS) {
      showToast(`여행은 최대 ${MAX_TRIP_DAYS}일까지 선택할 수 있어요`);
      return;
    }

    onChange(nextRange);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex justify-center bg-semantic-900/50"
      onMouseDown={(event) => {
        if (event.currentTarget === event.target) onCancel();
      }}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-label="여행 일자 선택"
        className="fixed bottom-0 w-full max-w-container rounded-t-card
        bg-semantic-100 px-6 pb-[max(24px,env(safe-area-inset-bottom))]
        pt-7 shadow-2xl"
      >
        <DayPicker
          animate
          mode="range"
          resetOnSelect
          locale={ko}
          showOutsideDays
          navLayout="around"
          selected={value}
          onSelect={handleSelect}
          defaultMonth={value?.from}
          className={styles.calendar}
          formatters={{
            formatCaption: (month) =>
              `${month.getFullYear()}년 ${month.getMonth() + 1}월`,
          }}
        />

        <p className="mb-8 mt-5 text-center text-b2 text-semantic-600">
          여행은 최대 {MAX_TRIP_DAYS}일까지 선택할 수 있어요
        </p>

        <div className="grid grid-cols-2 gap-3">
          <Button onClick={onCancel}>취소</Button>
          <Button buttonBg="blue" disabled={!value?.from} onClick={onConfirm}>
            다음
          </Button>
        </div>
      </section>
    </div>
  );
}
