"use client";

import MenuTitle from "@/components/common/menu-title/MenuTitle";
import Tab from "@/components/common/tab/Tab";
import Inner from "@/components/layout/Inner";
import {
  ArrowLeftRight,
  CalendarDays,
  CarFront,
  ChevronRight,
} from "lucide-react";
import { useState } from "react";

const DAY_TABS = Array.from({ length: 3 }, (_, index) => ({
  label: `Day ${index + 1}`,
  value: `day${index + 1}`,
}));

type Suggestion = {
  id: string;
  type: "order" | "transport" | "move-day";
  title: string;
  description: string;
  effect: string;
};

const SUGGESTIONS: Record<string, Suggestion[]> = {
  day1: [],
  day2: [
    {
      id: "order",
      type: "order",
      title: "순서 변경",
      description: "해운대 → 감천 → 광안리",
      effect: "이동시간 35분 단축",
    },
    {
      id: "transport",
      type: "transport",
      title: "이동수단 변경",
      description: "해운대 → 광안리 구간",
      effect: "이동시간 15분 단축",
    },
    {
      id: "move-day",
      type: "move-day",
      title: "일정 이동",
      description: "감천 → DAY2로 이동",
      effect: "종합 점수 상승",
    },
  ],
  day3: [],
};

function getEffectMark(effect: string) {
  if (effect.includes("단축")) return "▼";
  if (effect.includes("상승")) return "▲";
  return "";
}

export default function SuggestionPage() {
  const [selectedDay, setSelectedDay] = useState("day1");
  const suggestions = SUGGESTIONS[selectedDay] ?? [];

  return (
    <>
      <MenuTitle>개선 제안</MenuTitle>
      <Inner>
        <main className="pt-8 pb-10">
          <Tab items={DAY_TABS} value={selectedDay} onChange={setSelectedDay} />

          <section className="mt-12">
            <h1 className="text-h3 font-bold text-semantic-800">개선 제안</h1>

            {suggestions.length > 0 ? (
              <>
                <ul className="my-5 flex flex-col gap-5">
                  {suggestions.map((suggestion) => {
                    return (
                      <li key={suggestion.id}>
                        <button
                          type="button"
                          className="flex w-full items-center rounded-card border 
                        border-semantic-300 bg-semantic-100 px-6 py-7 
                        text-left shadow-card transition-colors hover:bg-semantic-300"
                        >
                          <div className="center size-14 shrink-0 rounded-[14px] text-white">
                            {suggestion.type === "order" && (
                              <span className="center size-full rounded-[14px] bg-blue-500">
                                <ArrowLeftRight
                                  size={24}
                                  strokeWidth={2.5}
                                  aria-hidden="true"
                                />
                              </span>
                            )}
                            {suggestion.type === "transport" && (
                              <span className="center size-full rounded-[14px] bg-green-500">
                                <CarFront
                                  size={24}
                                  strokeWidth={2.5}
                                  aria-hidden="true"
                                />
                              </span>
                            )}
                            {suggestion.type === "move-day" && (
                              <span className="center size-full rounded-[14px] bg-[#ed6c9e]">
                                <CalendarDays
                                  size={24}
                                  strokeWidth={2.5}
                                  aria-hidden="true"
                                />
                              </span>
                            )}
                          </div>

                          <span className="ml-5 min-w-0 flex-1">
                            <strong className="block text-b1 font-semibold text-semantic-800">
                              {suggestion.title}
                            </strong>
                            <span className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-2">
                              <span className="text-b3 text-semantic-600">
                                {suggestion.description}
                              </span>
                              <span
                                className={`rounded-full px-3 py-1 text-d1 font-semibold ${
                                  suggestion.type === "order"
                                    ? "bg-blue-100 text-blue-500"
                                    : suggestion.type === "transport"
                                      ? "bg-green-100 text-green-500"
                                      : "bg-[#fde2ec] text-[#ed6c9e]"
                                }`}
                              >
                                {suggestion.effect}{" "}
                                {getEffectMark(suggestion.effect)}
                              </span>
                            </span>
                          </span>

                          <ChevronRight
                            className="ml-3 shrink-0 text-semantic-400"
                            size={26}
                            strokeWidth={2}
                            aria-hidden="true"
                          />
                        </button>
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
