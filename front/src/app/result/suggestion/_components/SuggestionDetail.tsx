"use client";

import BottomActionBar from "@/components/common/buttons/BottomActionBar";
import MenuTitle from "@/components/common/menu-title/MenuTitle";
import Inner from "@/components/layout/Inner";
import {
  applyReorderSuggestion,
  applyTransportSuggestion,
  applyTimeSuggestion,
  applyTripSuggestion,
} from "@/api/simulation";
import { showToast } from "@/lib/utils/toast";
import { usePlanScheduleStore } from "@/stores/usePlanScheduleStore";
import { useState } from "react";
import type { SuggestionType } from "../_data/suggestion-detail-data";
import {
  getSimulationSuggestionDetail,
  getSimulationSuggestions,
} from "../_data/simulation-suggestions";
import { useSuggestionDetailNavigation } from "../_hooks/useSuggestionDetailNavigation";
import SuggestionChangeCard from "./SuggestionChangeCard";
import SuggestionEffectCard from "./SuggestionEffectCard";

type SuggestionDetailProps = {
  type: SuggestionType;
  suggestionId: string | null;
  date: string | null;
  day: string | null;
  applied: string | null;
};

export default function SuggestionDetail({
  type,
  suggestionId,
  date,
  day,
  applied,
}: SuggestionDetailProps) {
  const result = usePlanScheduleStore((state) => state.analysisResult);
  const analysisRequest = usePlanScheduleStore(
    (state) => state.analysisRequest,
  );
  const applyReorderResult = usePlanScheduleStore(
    (state) => state.applyReorderResult,
  );
  const applyTransportResult = usePlanScheduleStore(
    (state) => state.applyTransportResult,
  );
  const applyTimeResult = usePlanScheduleStore((state) => state.applyTimeResult);
  const applyTripResult = usePlanScheduleStore((state) => state.applyTripResult);
  const [isApplying, setIsApplying] = useState(false);
  const suggestion = getSimulationSuggestions(result).find(
    (item) => item.id === suggestionId && item.type === type,
  );
  const detail =
    result && suggestion
      ? getSimulationSuggestionDetail(suggestion, result)
      : null;
  const { viewSuggestionList, applySuggestion } =
    useSuggestionDetailNavigation(type, { date, day, applied, suggestionId });

  const handleApplySuggestion = async () => {
    const operation = suggestion?.raw.operation;
    if (isApplying || !operation || !analysisRequest || !result || !suggestion) {
      showToast("이 제안은 아직 자동 적용할 수 없어요.");
      return;
    }

    setIsApplying(true);
    try {
      if (operation.type === "REORDER") {
        const response = await applyReorderSuggestion({
          itinerary: analysisRequest,
          suggestion_id: suggestion.id,
          day_number: operation.day_number,
          ordered_contentids: operation.ordered_contentids,
        });
        applyReorderResult({
          day: `day${operation.day_number}`,
          orderedContentIds: operation.ordered_contentids,
          request: response.updated_itinerary,
          previousResult: response.previous_result,
          updatedResult: response.updated_result,
          comparison: response.comparison,
          suggestionId: response.applied_suggestion_id,
        });
      } else if (operation.type === "CHANGE_TRANSPORT") {
        const response = await applyTransportSuggestion({
          itinerary: analysisRequest,
          suggestion_id: suggestion.id,
          day_number: operation.day_number,
          origin_contentid: operation.origin_contentid,
          destination_contentid: operation.destination_contentid,
          from_mode: operation.from_mode,
          to_mode: operation.to_mode,
        });
        applyTransportResult({
          day: `day${operation.day_number}`,
          originContentId: operation.origin_contentid,
          transportMode: operation.to_mode,
          request: response.updated_itinerary,
          previousResult: response.previous_result,
          updatedResult: response.updated_result,
          comparison: response.comparison,
          suggestionId: response.applied_suggestion_id,
        });
      } else if (operation.type === "CHANGE_VISIT_TIME") {
        const response = await applyTimeSuggestion({
          itinerary: analysisRequest,
          suggestion_id: suggestion.id,
          day_number: operation.day_number,
          contentid: operation.contentid,
          from_time: operation.from_time,
          to_time: operation.to_time,
        });
        applyTimeResult({
          day: `day${operation.day_number}`,
          contentId: operation.contentid,
          visitStartTime: operation.to_time,
          request: response.updated_itinerary,
          previousResult: response.previous_result,
          updatedResult: response.updated_result,
          comparison: response.comparison,
          suggestionId: response.applied_suggestion_id,
        });
      } else if (
        operation.type === "MOVE_PLACE_DAY" ||
        operation.type === "REPLACE_CLOSED_PLACE" ||
        operation.type === "OPTIMIZE_TRIP"
      ) {
        const response = await applyTripSuggestion({
          itinerary: analysisRequest,
          suggestion_id: suggestion.id,
          action: operation.type,
          contentid:
            operation.type === "OPTIMIZE_TRIP" ? undefined : operation.contentid,
          from_day_number:
            operation.type === "MOVE_PLACE_DAY"
              ? operation.from_day_number
              : operation.type === "REPLACE_CLOSED_PLACE"
                ? operation.day_number
                : undefined,
          to_day_number:
            operation.type === "MOVE_PLACE_DAY"
              ? operation.to_day_number
              : undefined,
          replacement_contentid:
            operation.type === "REPLACE_CLOSED_PLACE"
              ? operation.replacement.contentid
              : undefined,
        });
        applyTripResult({
          request: response.updated_itinerary,
          previousResult: response.previous_result,
          updatedResult: response.updated_result,
          comparison: response.comparison,
          suggestionId: response.applied_suggestion_id,
        });
      }
      applySuggestion();
    } catch {
      showToast("제안을 적용하지 못했어요. 다시 시도해 주세요.");
    } finally {
      setIsApplying(false);
    }
  };

  if (!detail) {
    return (
      <>
        <MenuTitle>개선 제안</MenuTitle>
        <Inner>
          <p className="py-24 text-center text-b3 text-semantic-600">
            분석 제안을 불러올 수 없어요. 일정을 다시 분석해 주세요.
          </p>
        </Inner>
      </>
    );
  }

  return (
    <div className="flex min-h-dvh flex-col">
      <MenuTitle>{detail.title}</MenuTitle>

      <Inner styles="flex-1">
        <main className="pt-8 pb-28">
          <section>
            <h1 className="text-h3 font-bold text-semantic-800">
              변경 전 → 후
            </h1>

            <SuggestionChangeCard changes={detail.changes} />
          </section>

          <section className="mt-12">
            <h2 className="text-h3 font-bold text-semantic-800">기대효과</h2>

            <SuggestionEffectCard effects={detail.effects} />
          </section>
        </main>
      </Inner>

      <BottomActionBar
        secondaryAction={{
          label: "다른 제안 보기",
          onClick: viewSuggestionList,
        }}
        primaryAction={{
          label: isApplying ? "제안 적용 중..." : "이 제안 적용하기",
          onClick: handleApplySuggestion,
        }}
      />
    </div>
  );
}
