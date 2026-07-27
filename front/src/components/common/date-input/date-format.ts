import type { DateRange } from "@daypicker/react";

export const formatDate = (date: Date) =>
  [date.getFullYear(), date.getMonth() + 1, date.getDate()]
    .map((part, index) =>
      index === 0 ? String(part) : String(part).padStart(2, "0"),
    )
    .join(".");

export const formatDateRange = (range: DateRange) => {
  if (!range.from) return "";

  return `${formatDate(range.from)} ~ ${formatDate(range.to || range.from)}`;
};

export const getInclusiveDayCount = (range: DateRange) => {
  if (!range.from || !range.to) return 1;

  const fromTime = Date.UTC(
    range.from.getFullYear(),
    range.from.getMonth(),
    range.from.getDate(),
  );
  const toTime = Date.UTC(
    range.to.getFullYear(),
    range.to.getMonth(),
    range.to.getDate(),
  );

  return Math.abs(toTime - fromTime) / (1000 * 60 * 60 * 24) + 1;
};
