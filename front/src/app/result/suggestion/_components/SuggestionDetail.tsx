"use client";

import BottomActionBar from "@/components/common/buttons/BottomActionBar";
import MenuTitle from "@/components/common/menu-title/MenuTitle";
import Inner from "@/components/layout/Inner";
import { usePlanScheduleStore } from "@/stores/usePlanScheduleStore";
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
  const suggestion = getSimulationSuggestions(result).find(
    (item) => item.id === suggestionId && item.type === type,
  );
  const detail =
    result && suggestion
      ? getSimulationSuggestionDetail(suggestion, result)
      : null;
  const { viewSuggestionList, applySuggestion } =
    useSuggestionDetailNavigation(type, { date, day, applied, suggestionId });

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
          label: "이 제안 적용하기",
          onClick: applySuggestion,
        }}
      />
    </div>
  );
}
