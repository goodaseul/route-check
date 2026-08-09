import type { SuggestionType } from "./suggestion-detail-data";

export type Suggestion = {
  id: string;
  type: SuggestionType;
  title: string;
  description: string;
  effect: string;
};

export const SUGGESTIONS: Record<string, Suggestion[]> = {
  day1: [],
  day2: [
    {
      id: "order",
      type: "order",
      title: "순서 변경",
      description: "해운대 → 감천 → 광안리",
      effect: "이동시간 35분 단축",
    },
    {
      id: "transport",
      type: "transport",
      title: "이동수단 변경",
      description: "해운대 → 광안리 구간",
      effect: "이동시간 15분 단축",
    },
    {
      id: "move-day",
      type: "move-day",
      title: "일정 이동",
      description: "감천 → DAY2로 이동",
      effect: "종합 점수 상승",
    },
  ],
  day3: [],
};

export function parseAppliedSuggestions(value: string | null) {
  return new Set(
    (value ?? "")
      .split(",")
      .filter((type): type is SuggestionType =>
        ["order", "transport", "move-day"].includes(type),
      ),
  );
}
