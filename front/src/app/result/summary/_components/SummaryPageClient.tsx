"use client";

import ScoreCard from "@/components/common/score-card/ScoreCard";
import TitleSm from "@/components/common/title-sm/TitleSm";
import Inner from "@/components/layout/Inner";
import MenuTitle from "@/components/common/menu-title/MenuTitle";
import { usePlanScheduleStore } from "@/stores/usePlanScheduleStore";
import SummaryDetails from "./SummaryDetails";

type SummaryPageClientProps = {
  date: string | null;
  isConfirmed: boolean;
};

export default function SummaryPageClient({
  date,
  isConfirmed,
}: SummaryPageClientProps) {
  const result = usePlanScheduleStore((state) => state.analysisResult);

  if (!result) {
    return (
      <>
        <MenuTitle>분석 결과</MenuTitle>
        <Inner>
          <div className="py-24 text-center text-b2 text-semantic-600">
            분석 결과를 불러오는 중이에요...
          </div>
        </Inner>
      </>
    );
  }

  const score = result.total_score ?? result.overall_score;
  const description = result.status_message ?? result.status_label;
  const isPerfectScore = score === 100;
  const firstWarning = result.warnings[0]?.message;

  return (
    <>
      <MenuTitle>분석 결과</MenuTitle>
      <Inner>
        <div className="flex flex-col gap-4">
          <ScoreCard
            score={score}
            deduction={Math.max(0, 100 - score)}
            description={description}
          />
        </div>
        {!isPerfectScore && !isConfirmed && firstWarning && (
          <p className="mt-4 rounded-[8px] bg-orange px-6 py-3 text-b3 font-medium text-semantic-100">
            {firstWarning}
          </p>
        )}

        <div className="pt-12 pb-6">
          <TitleSm>일정 요약</TitleSm>
        </div>
        <SummaryDetails
          result={result}
          isPerfectScore={isPerfectScore}
          isConfirmed={isConfirmed}
          date={date}
        />
      </Inner>
    </>
  );
}
