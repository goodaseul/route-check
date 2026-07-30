"use client";

import MenuTitle from "@/components/common/menu-title/MenuTitle";
import Tab from "@/components/common/tab/Tab";
import Inner from "@/components/layout/Inner";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import {
  parseAppliedSuggestions,
  SUGGESTIONS,
} from "./_data/suggestion-list-data";
import SuggestionCard from "./_components/SuggestionCard";

const DAY_TABS = Array.from({ length: 3 }, (_, index) => ({
  label: `Day ${index + 1}`,
  value: `day${index + 1}`,
}));

function SuggestionPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const dayParam = searchParams.get("day");
  const selectedDay = DAY_TABS.some((day) => day.value === dayParam)
    ? dayParam!
    : "day1";
  const appliedSuggestions = parseAppliedSuggestions(
    searchParams.get("applied"),
  );
  const suggestions = (SUGGESTIONS[selectedDay] ?? []).filter(
    (suggestion) => !appliedSuggestions.has(suggestion.type),
  );

  const changeDay = (day: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("day", day);
    router.replace(`/result/suggestion?${params.toString()}`, {
      scroll: false,
    });
  };

  const openSuggestion = (type: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("day", selectedDay);
    router.push(`/result/suggestion/${type}?${params.toString()}`);
  };

  return (
    <>
      <MenuTitle>개선 제안</MenuTitle>
      <Inner>
        <main className="pt-8 pb-10">
          <Tab items={DAY_TABS} value={selectedDay} onChange={changeDay} />

          <section className="mt-12">
            <h1 className="text-h3 font-bold text-semantic-800">개선 제안</h1>

            {suggestions.length > 0 ? (
              <>
                <ul className="my-5 flex flex-col gap-5">
                  {suggestions.map((suggestion) => {
                    return (
                      <li key={suggestion.id}>
                        <SuggestionCard
                          suggestion={suggestion}
                          onClick={() => openSuggestion(suggestion.type)}
                        />
                      </li>
                    );
                  })}
                </ul>
                <p className="text-b3 text-semantic-600">
                  버튼을 눌러 변경 내용을 미리 확인해보세요
                </p>
              </>
            ) : (
              <div className="mt-26.5 text-center">
                <p className="text-h3 font-semibold text-semantic-800">
                  이 날은 이미 완벽해요!
                </p>
                <p className="mt-1.5 text-b3 text-semantic-600">
                  이보다 더 좋은 동선은 없을 것 같아요,
                  <br />
                  걱정 없이 즐거운 여행 되세요
                </p>
              </div>
            )}
          </section>
        </main>
      </Inner>
    </>
  );
}

export default function SuggestionPage() {
  return (
    <Suspense fallback={null}>
      <SuggestionPageContent />
    </Suspense>
  );
}
