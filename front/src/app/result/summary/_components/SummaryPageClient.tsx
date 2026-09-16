"use client";

import ScoreCard from "@/components/common/score-card/ScoreCard";
import TitleSm from "@/components/common/title-sm/TitleSm";
import Inner from "@/components/layout/Inner";
import MenuTitle from "@/components/common/menu-title/MenuTitle";
import { usePlanScheduleStore } from "@/stores/usePlanScheduleStore";
import { useSyncExternalStore } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Button from "@/components/common/buttons/Button";
import SummaryDetails from "./SummaryDetails";

const emptySubscribe = () => () => {};

type SummaryPageClientProps = {
  date: string | null;
  transport?: string | null;
  isConfirmed: boolean;
};

export default function SummaryPageClient({
  date,
  transport,
  isConfirmed,
}: SummaryPageClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isMounted = useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false,
  );
  const result = usePlanScheduleStore((state) => state.analysisResult);
  const analysisRequest = usePlanScheduleStore((state) => state.analysisRequest);
  const invalidateAnalysis = usePlanScheduleStore(
    (state) => state.invalidateAnalysis,
  );

  const resolvedDate =
    date ??
    (analysisRequest?.start_date && analysisRequest?.end_date
      ? `${analysisRequest.start_date.replaceAll("-", ".")} ~ ${analysisRequest.end_date.replaceAll("-", ".")}`
      : null);

  const resolvedTransport =
    transport ??
    searchParams.get("transport") ??
    analysisRequest?.transport_mode ??
    "car";

  const handleBackToSchedule = () => {
    invalidateAnalysis();
    const navParams = new URLSearchParams();
    if (resolvedDate) navParams.set("date", resolvedDate);
    if (resolvedTransport) navParams.set("transport", resolvedTransport);
    const navQuery = navParams.toString();
    router.push(`/plan/schedule${navQuery ? `?${navQuery}` : ""}`);
  };

  if (!isMounted) {
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

  if (!result) {
    return (
      <>
        <MenuTitle onAction={() => router.push("/plan/date")}>
          분석 결과
        </MenuTitle>
        <Inner>
          <div className="py-20 flex flex-col items-center justify-center text-center">
            <p className="text-h3 font-semibold text-semantic-800">
              분석된 일정이 없어요
            </p>
            <p className="mt-2 text-b2 text-semantic-600">
              먼저 여행 일정을 구성하고 분석을 진행해 주세요.
            </p>
            <div className="mt-8 w-full max-w-xs">
              <Button buttonBg="blue" onClick={() => router.push("/plan/date")}>
                새 여행 일정 만들기
              </Button>
            </div>
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
      <MenuTitle onAction={handleBackToSchedule}>분석 결과</MenuTitle>
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
          date={resolvedDate ?? date}
        />
      </Inner>
    </>
  );
}
