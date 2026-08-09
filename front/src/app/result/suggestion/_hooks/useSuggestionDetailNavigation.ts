"use client";

import { useRouter } from "next/navigation";
import type { SuggestionType } from "../_data/suggestion-detail-data";

type SuggestionDetailParams = {
  date: string | null;
  day: string | null;
  applied: string | null;
};

export function useSuggestionDetailNavigation(
  type: SuggestionType,
  query: SuggestionDetailParams,
) {
  const router = useRouter();
  const listParams = createSuggestionParams(query);

  if (query.day && !/^day[1-5]$/.test(query.day)) {
    listParams.delete("day");
  }

  const viewSuggestionList = () => {
    router.push(`/result/suggestion?${listParams.toString()}`);
  };

  const applySuggestion = () => {
    const params = createSuggestionParams(query);
    const appliedSuggestions = new Set(
      (params.get("applied") ?? "").split(",").filter(Boolean),
    );
    appliedSuggestions.add(type);
    params.set("applied", Array.from(appliedSuggestions).join(","));
    router.push(`/result/suggestion/${type}/applied?${params.toString()}`);
  };

  return {
    viewSuggestionList,
    applySuggestion,
  };
}

function createSuggestionParams({
  date,
  day,
  applied,
}: SuggestionDetailParams) {
  const params = new URLSearchParams();
  if (date) params.set("date", date);
  if (day) params.set("day", day);
  if (applied) params.set("applied", applied);
  return params;
}
