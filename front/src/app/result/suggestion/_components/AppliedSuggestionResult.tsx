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
  const previousResult = usePlanScheduleStore(
    (state) => state.previousAnalysisResult,
  );
  const comparison = usePlanScheduleStore(
    (state) => state.analysisComparison,
  );
  const lastAppliedSuggestionId = usePlanScheduleStore(
    (state) => state.lastAppliedSuggestionId,
  );
  const suggestions = getSimulationSuggestions(result);
  const sourceResult =
    lastAppliedSuggestionId === suggestionId && previousResult
      ? previousResult
      : result;
  const suggestion = getSimulationSuggestions(sourceResult).find(
    (item) => item.id === suggestionId && item.type === type,
  );
  const detail =
    sourceResult && suggestion
      ? getSimulationSuggestionDetail(suggestion, sourceResult)
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

          {comparison && (
            <section className="mt-8">
              <h2 className="text-b1 font-bold text-semantic-800">
                변경 전후 비교
              </h2>
              <dl className="mt-4 rounded-card border border-semantic-300 bg-semantic-100 px-6 py-3 shadow-card">
                <ComparisonRow
                  label="종합 점수"
                  before={`${comparison.previous_score}점`}
                  after={`${comparison.updated_score}점`}
                />
                <ComparisonRow
                  label="이동 거리"
                  before={`${comparison.previous_distance_km}km`}
                  after={`${comparison.updated_distance_km}km`}
                />
                <ComparisonRow
                  label="이동 시간"
                  before={`${comparison.previous_transit_minutes}분`}
                  after={`${comparison.updated_transit_minutes}분`}
                  isLast
                />
              </dl>
            </section>
          )}
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

function ComparisonRow({
  label,
  before,
  after,
  isLast = false,
}: {
  label: string;
  before: string;
  after: string;
  isLast?: boolean;
}) {
  return (
    <div
      className={`flex items-center justify-between py-3 ${
        isLast ? "" : "border-b border-semantic-300"
      }`}
    >
      <dt className="text-d1 font-medium text-semantic-600">{label}</dt>
      <dd className="text-b3 font-semibold text-semantic-800">
        <span className="text-semantic-500">{before}</span>
        <span className="px-2">→</span>
        <span className="text-blue-500">{after}</span>
      </dd>
    </div>
  );
}
