"use client";

import BottomActionBar from "@/components/common/buttons/BottomActionBar";
import MenuTitle from "@/components/common/menu-title/MenuTitle";
import Inner from "@/components/layout/Inner";
import { useRouter, useSearchParams } from "next/navigation";
import type { SuggestionDetail as SuggestionDetailData } from "../_data/suggestion-detail-data";
import SuggestionChangeCard from "./SuggestionChangeCard";
import SuggestionEffectCard from "./SuggestionEffectCard";

type SuggestionDetailProps = {
  detail: SuggestionDetailData;
};

export default function SuggestionDetail({ detail }: SuggestionDetailProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const dayParam = searchParams.get("day");
  const listParams = new URLSearchParams(searchParams.toString());
  if (dayParam && !/^day[1-5]$/.test(dayParam)) listParams.delete("day");
  const suggestionListUrl = `/result/suggestion?${listParams.toString()}`;

  const applySuggestion = () => {
    const params = new URLSearchParams(searchParams.toString());
    const appliedSuggestions = new Set(
      (params.get("applied") ?? "").split(",").filter(Boolean),
    );
    appliedSuggestions.add(detail.type);
    params.set("applied", Array.from(appliedSuggestions).join(","));
    router.push(
      `/result/suggestion/${detail.type}/applied?${params.toString()}`,
    );
  };

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
          onClick: () => router.push(suggestionListUrl),
        }}
        primaryAction={{
          label: "이 제안 적용하기",
          onClick: applySuggestion,
        }}
      />
    </div>
  );
}
