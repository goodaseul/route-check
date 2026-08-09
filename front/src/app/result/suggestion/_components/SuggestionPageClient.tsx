"use client";

import MenuTitle from "@/components/common/menu-title/MenuTitle";
import Tab from "@/components/common/tab/Tab";
import Inner from "@/components/layout/Inner";
import { useSuggestionList } from "../_hooks/useSuggestionList";
import SuggestionCard from "./SuggestionCard";

type SuggestionPageClientProps = {
  date: string | null;
  day: string | null;
  applied: string | null;
};

export default function SuggestionPageClient(
  props: SuggestionPageClientProps,
) {
  const { dayTabs, selectedDay, suggestions, changeDay, openSuggestion } =
    useSuggestionList(props);

  return (
    <>
      <MenuTitle>개선 제안</MenuTitle>
      <Inner>
        <main className="pt-8 pb-10">
          <Tab items={dayTabs} value={selectedDay} onChange={changeDay} />

          <section className="mt-12">
            <h1 className="text-h3 font-bold text-semantic-800">개선 제안</h1>

            {suggestions.length > 0 ? (
              <>
                <ul className="my-5 flex flex-col gap-5">
                  {suggestions.map((suggestion) => (
                    <li key={suggestion.id}>
                      <SuggestionCard
                        suggestion={suggestion}
                        onClick={() => openSuggestion(suggestion.type)}
                      />
                    </li>
                  ))}
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
