"use client";

import { useRouter } from "next/navigation";
import {
  getInclusiveDayCount,
  parseDateRange,
} from "@/components/common/date-input/date-format";
import {
  parseAppliedSuggestions,
} from "../_data/suggestion-list-data";
import { usePlanScheduleStore } from "@/stores/usePlanScheduleStore";
import { getSimulationSuggestions } from "../_data/simulation-suggestions";

type SuggestionListParams = {
  date: string | null;
  day: string | null;
  applied: string | null;
};

export function useSuggestionList({
  date,
  day,
  applied,
}: SuggestionListParams) {
  const router = useRouter();
  const result = usePlanScheduleStore((state) => state.analysisResult);
  const apiSuggestions = getSimulationSuggestions(result);
  const dateRange = parseDateRange(date);
  const totalDays = dateRange
    ? getInclusiveDayCount(dateRange)
    : Math.max(result?.timeline.length ?? 0, 1);
  const dayTabs = Array.from({ length: totalDays }, (_, index) => ({
    label: `Day ${index + 1}`,
    value: `day${index + 1}`,
  }));
  const selectedDay = dayTabs.some((tab) => tab.value === day)
    ? day!
    : "day1";
  const appliedSuggestions = parseAppliedSuggestions(applied);
  const selectedDayNumber = Number(selectedDay.replace("day", ""));
  const suggestions = apiSuggestions.filter(
    (suggestion) =>
      suggestion.dayNumber === selectedDayNumber &&
      !appliedSuggestions.has(suggestion.type),
  );

  const changeDay = (day: string) => {
    const params = createSuggestionParams({ date, day, applied });
    params.set("day", day);
    router.replace(`/result/suggestion?${params.toString()}`, {
      scroll: false,
    });
  };

  const openSuggestion = (type: string, suggestionId: string) => {
    const params = createSuggestionParams({ date, day, applied });
    params.set("day", selectedDay);
    params.set("suggestion", suggestionId);
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

function createSuggestionParams({
  date,
  day,
  applied,
}: SuggestionListParams) {
  const params = new URLSearchParams();
  if (date) params.set("date", date);
  if (day) params.set("day", day);
  if (applied) params.set("applied", applied);
  return params;
}
