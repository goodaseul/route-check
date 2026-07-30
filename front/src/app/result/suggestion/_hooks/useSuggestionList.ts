"use client";

import { useRouter, useSearchParams } from "next/navigation";
import {
  getInclusiveDayCount,
  parseDateRange,
} from "@/components/common/date-input/date-format";
import {
  parseAppliedSuggestions,
  SUGGESTIONS,
} from "../_data/suggestion-list-data";

export function useSuggestionList() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const dateRange = parseDateRange(searchParams.get("date"));
  const totalDays = dateRange
    ? getInclusiveDayCount(dateRange)
    : Object.keys(SUGGESTIONS).length;
  const dayTabs = Array.from({ length: totalDays }, (_, index) => ({
    label: `Day ${index + 1}`,
    value: `day${index + 1}`,
  }));
  const dayParam = searchParams.get("day");
  const selectedDay = dayTabs.some((day) => day.value === dayParam)
    ? dayParam!
    : "day1";
  const appliedSuggestions = parseAppliedSuggestions(
    searchParams.get("applied"),
  );
  const suggestions = (SUGGESTIONS[selectedDay] ?? []).filter(
    (suggestion) => !appliedSuggestions.has(suggestion.type),
  );

  const changeDay = (day: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("day", day);
    router.replace(`/result/suggestion?${params.toString()}`, {
      scroll: false,
    });
  };

  const openSuggestion = (type: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("day", selectedDay);
    router.push(`/result/suggestion/${type}?${params.toString()}`);
  };

  return {
    dayTabs,
    selectedDay,
    suggestions,
    changeDay,
    openSuggestion,
  };
}
