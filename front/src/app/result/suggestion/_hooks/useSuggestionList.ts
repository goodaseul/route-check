"use client";

import { useRouter, useSearchParams } from "next/navigation";
import {
  parseAppliedSuggestions,
  SUGGESTIONS,
} from "../_data/suggestion-list-data";

export const DAY_TABS = Array.from({ length: 3 }, (_, index) => ({
  label: `Day ${index + 1}`,
  value: `day${index + 1}`,
}));

export function useSuggestionList() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const dayParam = searchParams.get("day");
  const selectedDay = DAY_TABS.some((day) => day.value === dayParam)
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
    selectedDay,
    suggestions,
    changeDay,
    openSuggestion,
  };
}
