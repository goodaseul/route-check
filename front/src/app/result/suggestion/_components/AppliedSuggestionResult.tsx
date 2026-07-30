"use client";

import BottomActionBar from "@/components/common/buttons/BottomActionBar";
import ResultState from "@/components/common/result-state/ResultState";
import MenuTitle from "@/components/common/menu-title/MenuTitle";
import Inner from "@/components/layout/Inner";
import { useRouter } from "next/navigation";
import type { SuggestionDetail } from "../_data/suggestion-detail-data";
import AppliedSuggestionCard from "./AppliedSuggestionCard";

type AppliedSuggestionResultProps = {
  detail: SuggestionDetail;
  day: string;
  applied: string;
  hasRemainingSuggestions: boolean;
};

export default function AppliedSuggestionResult({
  detail,
  day,
  applied,
  hasRemainingSuggestions,
}: AppliedSuggestionResultProps) {
  const router = useRouter();
  const query = new URLSearchParams({ day, applied }).toString();

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
