import type {
  SimulationResponse,
  SimulationSuggestion,
} from "@/api/types/simulation";
import type { SuggestionDetail, SuggestionType } from "./suggestion-detail-data";
import type { Suggestion } from "./suggestion-list-data";

export type ApiSuggestion = Suggestion & {
  apiIndex: number;
  dayNumber: number;
  raw: SimulationSuggestion;
};

function mapSuggestionType(value = ""): SuggestionType {
  if (value.includes("순서") || value.includes("REORDER")) return "order";
  if (value.includes("교통") || value.includes("TRANSPORT")) return "transport";
  return "move-day";
}

function getEffect(description: string) {
  const time = description.match(/(?:시간을 |약 )(\d+)분 (?:단축|빠릅니다)/);
  if (time) return `이동시간 ${time[1]}분 단축`;

  const distance = description.match(/거리(?:를|\()\s*(\d+(?:\.\d+)?)km/);
  if (distance) return `이동거리 ${distance[1]}km 개선`;

  return "분석 결과 반영";
}

export function getSimulationSuggestions(
  result: SimulationResponse | null,
): ApiSuggestion[] {
  return (result?.suggestions ?? []).map((raw, apiIndex) => {
    const description = raw.description?.trim() || "일정 조정이 필요합니다.";
    const type = mapSuggestionType(`${raw.type ?? ""} ${raw.title ?? ""}`);

    return {
      id: raw.suggestion_id || `suggestion-${apiIndex}`,
      apiIndex,
      dayNumber: raw.day_number ?? 1,
      type,
      title: raw.title?.trim() || "일정 개선 제안",
      description,
      effect: getEffect(description),
      raw,
    };
  });
}

export function getSimulationSuggestionDetail(
  suggestion: ApiSuggestion,
  result: SimulationResponse,
): SuggestionDetail {
  const daySchedule =
    result.timeline.find((day) => day.day_number === suggestion.dayNumber)
      ?.schedule ?? [];
  const beforeRoute = daySchedule.map((place) => place.title).join(" → ");
  const afterRoute = suggestion.raw.applied_route?.join(" → ");
  const isOrderSuggestion = suggestion.type === "order" && afterRoute;
  const operation = suggestion.raw.operation;
  if (suggestion.type === "transport" && operation?.type === "CHANGE_TRANSPORT") {
    const origin = daySchedule.find(
      (place) => place.contentid === operation.origin_contentid,
    );
    const destination = daySchedule.find(
      (place) => place.contentid === operation.destination_contentid,
    );
    const modeLabel = (mode: string) =>
      mode === "car" ? "자차" : mode === "public" ? "대중교통" : mode;
    const fareDelta =
      operation.updated_estimated_fare - operation.previous_estimated_fare;

    return {
      type: suggestion.type,
      title: suggestion.title,
      appliedDescription: `${origin?.title ?? "출발지"} → ${destination?.title ?? "도착지"}`,
      changes: [
        {
          label: "구간",
          value: `${origin?.title ?? "출발지"} → ${destination?.title ?? "도착지"}`,
        },
        {
          label: "변경 전",
          value: `${modeLabel(operation.from_mode)} ${operation.previous_duration_minutes}분`,
        },
        {
          label: "변경 후",
          value: `${modeLabel(operation.to_mode)} ${operation.updated_duration_minutes}분`,
          emphasized: true,
        },
      ],
      effects: [
        {
          label: "이동시간",
          value: `${operation.previous_duration_minutes - operation.updated_duration_minutes}분 단축`,
          tone: "blue",
        },
        {
          label: "예상 비용",
          value: `${fareDelta >= 0 ? "+" : ""}${fareDelta.toLocaleString()}원`,
          tone: fareDelta > 0 ? "red" : "green",
        },
      ],
    };
  }

  return {
    type: suggestion.type,
    title: suggestion.title,
    appliedDescription: isOrderSuggestion ? afterRoute : suggestion.description,
    changes: isOrderSuggestion
      ? [
          { label: "변경 전", value: beforeRoute || "현재 일정" },
          { label: "변경 후", value: afterRoute, emphasized: true },
        ]
      : [
          { label: "분석 기준", value: suggestion.title },
          {
            label: "권장 변경",
            value: suggestion.description,
            emphasized: true,
          },
        ],
    effects: [
      {
        label: "예상 효과",
        value: suggestion.effect,
        tone: suggestion.type === "transport" ? "green" : "blue",
      },
    ],
  };
}
