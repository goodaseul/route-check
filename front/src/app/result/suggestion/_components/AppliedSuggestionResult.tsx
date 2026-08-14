"use client";

import BottomActionBar from "@/components/common/buttons/BottomActionBar";
import ResultState from "@/components/common/result-state/ResultState";
import MenuTitle from "@/components/common/menu-title/MenuTitle";
import Inner from "@/components/layout/Inner";
import { useRouter } from "next/navigation";
import { usePlanScheduleStore } from "@/stores/usePlanScheduleStore";
import type { SuggestionType } from "../_data/suggestion-detail-data";
import { parseAppliedSuggestions } from "../_data/suggestion-list-data";
import {
  getSimulationSuggestionDetail,
  getSimulationSuggestions,
} from "../_data/simulation-suggestions";
import AppliedSuggestionCard from "./AppliedSuggestionCard";

type AppliedSuggestionResultProps = {
  type: SuggestionType;
  suggestionId: string | null;
  day: string;
  applied: string;
  date: string | null;
};

export default function AppliedSuggestionResult({
  type,
  suggestionId,
  day,
  applied,
  date,
}: AppliedSuggestionResultProps) {
  const router = useRouter();
  const result = usePlanScheduleStore((state) => state.analysisResult);
  const suggestions = getSimulationSuggestions(result);
  const suggestion = suggestions.find(
    (item) => item.id === suggestionId && item.type === type,
  );
  const detail =
    result && suggestion
      ? getSimulationSuggestionDetail(suggestion, result)
      : null;
  const appliedSuggestions = parseAppliedSuggestions(applied);
  const dayNumber = Number(day.replace("day", ""));
  const hasRemainingSuggestions = suggestions.some(
    (item) =>
      item.dayNumber === dayNumber && !appliedSuggestions.has(item.type),
  );
  const params = new URLSearchParams({ day, applied });
  if (date) params.set("date", date);
  if (suggestionId) params.set("suggestion", suggestionId);
  const query = params.toString();

  if (!detail) {
    return (
      <>
        <MenuTitle>개선 제안</MenuTitle>
        <Inner>
          <p className="py-24 text-center text-b3 text-semantic-600">
            적용된 분석 제안을 불러올 수 없어요.
          </p>
        </Inner>
      </>
    );
  }

  return (
    <div className="flex min-h-dvh flex-col">
      <MenuTitle> </MenuTitle>

      <Inner styles="flex flex-1 flex-col">
        <main className="flex flex-1 flex-col pb-8">
          <ResultState
            status="success"
            title="제안이 적용됐어요!"
            description="결과에서 달라진 점수를 확인해보세요"
            className="flex-1"
          />

          <section>
            <h2 className="text-b1 font-bold text-semantic-800">적용된 제안</h2>
            <AppliedSuggestionCard detail={detail} />
          </section>
        </main>
      </Inner>

      <BottomActionBar
        secondaryAction={
          hasRemainingSuggestions
            ? {
                label: "다른 제안 더보기",
                onClick: () => router.push(`/result/suggestion?${query}`),
              }
            : undefined
        }
        primaryAction={{
          label: "결과 보기",
          onClick: () => router.push(`/result/summary?${query}`),
        }}
      />
    </div>
  );
}
