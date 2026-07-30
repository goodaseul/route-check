export const SUGGESTION_TYPES = [
  "order",
  "transport",
  "move-day",
] as const;

export type SuggestionType = (typeof SUGGESTION_TYPES)[number];

export type SuggestionDetail = {
  type: SuggestionType;
  title: string;
  appliedDescription: string;
  changes: Array<{
    label: string;
    value: string;
    emphasized?: boolean;
  }>;
  effects: Array<{
    label: string;
    value: string;
    tone: "blue" | "green" | "pink" | "red";
  }>;
};

export const SUGGESTION_DETAIL_DATA: Record<
  SuggestionType,
  SuggestionDetail
> = {
  order: {
    type: "order",
    title: "순서 변경",
    appliedDescription: "해운대 → 감천 → 광안리",
    changes: [
      {
        label: "변경 전",
        value: "해운대 → 광안리 → 감천",
      },
      {
        label: "변경 후",
        value: "해운대 → 감천 → 광안리",
        emphasized: true,
      },
    ],
    effects: [
      {
        label: "변경 전",
        value: "2시간",
        tone: "blue",
      },
      {
        label: "변경 후",
        value: "1시간 25분",
        tone: "blue",
      },
      {
        label: "이동시간",
        value: "-35분 ▼",
        tone: "blue",
      },
    ],
  },
  transport: {
    type: "transport",
    title: "이동수단 변경",
    appliedDescription: "해운대 → 광안리 구간",
    changes: [
      {
        label: "구간",
        value: "해운대 해수욕장 → 광안리 해수욕장",
      },
      {
        label: "변경 전",
        value: "대중교통 25분",
      },
      {
        label: "변경 후",
        value: "택시 8분",
        emphasized: true,
      },
    ],
    effects: [
      {
        label: "이동시간",
        value: "-15분 ▼",
        tone: "blue",
      },
      {
        label: "예상 비용",
        value: "+9,000원 ▲",
        tone: "red",
      },
    ],
  },
  "move-day": {
    type: "move-day",
    title: "일정 이동",
    appliedDescription: "감천 → DAY2로 이동",
    changes: [
      {
        label: "장소",
        value: "감천 문화마을",
      },
      {
        label: "변경 전",
        value: "DAY1 · 3번째 방문",
      },
      {
        label: "변경 후",
        value: "DAY2 · 1번째 방문",
        emphasized: true,
      },
    ],
    effects: [
      {
        label: "종합 점수",
        value: "+6점 ▲",
        tone: "blue",
      },
      {
        label: "DAY1 이동시간",
        value: "-22분 ▼",
        tone: "blue",
      },
      {
        label: "DAY2 이동시간",
        value: "+8분 ▲",
        tone: "green",
      },
    ],
  },
};

export function isSuggestionType(value: string): value is SuggestionType {
  return SUGGESTION_TYPES.some((type) => type === value);
}
