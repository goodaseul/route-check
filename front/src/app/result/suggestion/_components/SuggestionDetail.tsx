"use client";

import BottomActionBar from "@/components/common/buttons/BottomActionBar";
import MenuTitle from "@/components/common/menu-title/MenuTitle";
import Inner from "@/components/layout/Inner";
import type { SuggestionDetail as SuggestionDetailData } from "../_data/suggestion-detail-data";
import { useSuggestionDetailNavigation } from "../_hooks/useSuggestionDetailNavigation";
import SuggestionChangeCard from "./SuggestionChangeCard";
import SuggestionEffectCard from "./SuggestionEffectCard";

type SuggestionDetailProps = {
  detail: SuggestionDetailData;
};

export default function SuggestionDetail({ detail }: SuggestionDetailProps) {
  const { viewSuggestionList, applySuggestion } =
    useSuggestionDetailNavigation(detail.type);

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
