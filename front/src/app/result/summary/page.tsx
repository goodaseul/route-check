import MenuTitle from "@/components/common/menu-title/MenuTitle";
import ScoreCard from "@/components/common/score-card/ScoreCard";
import TitleSm from "@/components/common/title-sm/TitleSm";
import Inner from "@/components/layout/Inner";
import SummaryDetails from "./_components/SummaryDetails";

const result = {
  id: 2,
  score: 80,
  deduction: 0,
  description: "무리 없이 편안하게 다닐 수 있어요",
};
type SummaryPageProps = {
  searchParams: Promise<{
    date?: string | string[];
    mode?: string | string[];
  }>;
};

export default async function SummaryPage({ searchParams }: SummaryPageProps) {
  const { date, mode } = await searchParams;
  const isPerfectScore = result.score === 100;
  const isConfirmed = mode === "confirmed";
  return (
    <>
      <MenuTitle>분석 결과</MenuTitle>
      <Inner>
        <div className="flex flex-col gap-4">
          <ScoreCard {...result} />
        </div>
        {!isPerfectScore && !isConfirmed && (
          <p className="font-medium mt-4 px-6 py-3 bg-orange text-b3 text-semantic-100 rounded-[8px]">
            오전 일정의 이동이 많아요. 개선 제안을 확인해보세요!
          </p>
        )}

        <div className="pt-12 pb-6">
          <TitleSm>일정 요약</TitleSm>
        </div>
        <SummaryDetails
          isPerfectScore={isPerfectScore}
          isConfirmed={isConfirmed}
          date={typeof date === "string" ? date : null}
        />
      </Inner>
    </>
  );
}
