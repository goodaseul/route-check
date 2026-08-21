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
  if (operation?.type === "CHANGE_VISIT_TIME") {
    const place = daySchedule.find(
      (item) => item.contentid === operation.contentid,
    );
    const reason =
      operation.reason === "PEAK_CONGESTION_OVERLAP"
        ? "혼잡 시간 회피"
        : "운영시간 준수";

    return {
      type: suggestion.type,
      title: suggestion.title,
      appliedDescription: `${place?.title ?? "방문 장소"} 시작시간 조정`,
      changes: [
        { label: "장소", value: place?.title ?? "방문 장소" },
        { label: "변경 전", value: operation.from_time },
        { label: "변경 후", value: operation.to_time, emphasized: true },
      ],
      effects: [{ label: "분석 기준", value: reason, tone: "blue" }],
    };
  }
  if (operation?.type === "MOVE_PLACE_DAY") {
    const place = daySchedule.find(
      (item) => item.contentid === operation.contentid,
    );
    return {
      type: suggestion.type,
      title: suggestion.title,
      appliedDescription: `${place?.title ?? "장소"} → DAY ${operation.to_day_number}`,
      changes: [
        { label: "장소", value: place?.title ?? "방문 장소" },
        { label: "변경 전", value: `DAY ${operation.from_day_number}` },
        {
          label: "변경 후",
          value: `DAY ${operation.to_day_number}`,
          emphasized: true,
        },
      ],
      effects: [{ label: "예상 효과", value: "휴무일 회피 및 일정 재분석", tone: "blue" }],
    };
  }
  if (operation?.type === "REPLACE_CLOSED_PLACE") {
    const place = daySchedule.find(
      (item) => item.contentid === operation.contentid,
    );
    return {
      type: suggestion.type,
      title: suggestion.title,
      appliedDescription: operation.replacement.title,
      changes: [
        { label: "변경 전", value: place?.title ?? "휴무 장소" },
        { label: "변경 후", value: operation.replacement.title, emphasized: true },
      ],
      effects: [
        {
          label: "기존 장소와 거리",
          value: `${operation.replacement.distance_from_original_km}km`,
          tone: "green",
        },
      ],
    };
  }
  if (operation?.type === "OPTIMIZE_TRIP") {
    return {
      type: suggestion.type,
      title: suggestion.title,
      appliedDescription: "전체 여행 일정 재배치",
      changes: [
        { label: "변경 전", value: "현재 날짜별 일정" },
        { label: "변경 후", value: "휴무일·일정 밀도·동선 최적화", emphasized: true },
      ],
      effects: [{ label: "분석 범위", value: "여행 전체 일차", tone: "blue" }],
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
