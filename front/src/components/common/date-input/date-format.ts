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

const parseDate = (value: string) => {
  const match = /^(\d{4})\.(\d{2})\.(\d{2})$/.exec(value.trim());
  if (!match) return undefined;

  const [, year, month, day] = match;
  const date = new Date(Number(year), Number(month) - 1, Number(day));

  if (
    date.getFullYear() !== Number(year) ||
    date.getMonth() !== Number(month) - 1 ||
    date.getDate() !== Number(day)
  ) {
    return undefined;
  }

  return date;
};

export const parseDateRange = (value: string | null): DateRange | undefined => {
  if (!value) return undefined;

  const [fromValue, toValue, ...rest] = value.split("~");
  if (!fromValue || rest.length > 0) return undefined;

  const from = parseDate(fromValue);
  const to = parseDate(toValue || fromValue);
  if (!from || !to || from > to) return undefined;

  return { from, to };
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
