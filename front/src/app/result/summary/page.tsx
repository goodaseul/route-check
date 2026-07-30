import MenuTitle from "@/components/common/menu-title/MenuTitle";
import ScoreCard from "@/components/common/score-card/ScoreCard";
import TitleSm from "@/components/common/title-sm/TitleSm";
import Inner from "@/components/layout/Inner";
import SummaryDetails from "./SummaryDetails";

const scores = [
  {
    id: 2,
    score: 100,
    deduction: 0,
    description: "무리 없이 편안하게 다닐 수 있어요",
  },
];
export default function SummaryPage() {
  const score = scores[0]?.score ?? 0;
  const isPerfectScore = score === 100;
  return (
    <>
      <MenuTitle>분석 결과</MenuTitle>
      <Inner>
        <div className="flex flex-col gap-4">
          {scores.map((item) => (
            <ScoreCard key={item.id} {...item} />
          ))}
        </div>
        {!isPerfectScore && (
          <p className="font-medium mt-4 px-6 py-3 bg-orange text-b3 text-semantic-100 rounded-[8px]">
            오전 일정의 이동이 많아요. 개선 제안을 확인해보세요!
          </p>
        )}

        <div className="pt-12 pb-6">
          <TitleSm>일정 요약</TitleSm>
        </div>
        <SummaryDetails isPerfectScore={isPerfectScore} />
      </Inner>
    </>
  );
}
