"use client";

import { useRouter, useSearchParams } from "next/navigation";
import type { SuggestionType } from "../_data/suggestion-detail-data";

export function useSuggestionDetailNavigation(type: SuggestionType) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const dayParam = searchParams.get("day");
  const listParams = new URLSearchParams(searchParams.toString());

  if (dayParam && !/^day[1-5]$/.test(dayParam)) {
    listParams.delete("day");
  }

  const viewSuggestionList = () => {
    router.push(`/result/suggestion?${listParams.toString()}`);
  };

  const applySuggestion = () => {
    const params = new URLSearchParams(searchParams.toString());
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
