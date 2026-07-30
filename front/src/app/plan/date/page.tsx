"use client";

import DateInput from "@/components/common/date-input/DateInput";
import Desc from "@/components/common/desc/Desc";
import MenuTitle from "@/components/common/menu-title/MenuTitle";
import RadioCard from "@/components/common/radio-card/RadioCard";
import Title from "@/components/common/title/Title";
import Inner from "@/components/layout/Inner";
import BottomActionBar from "@/components/common/buttons/BottomActionBar";
import { usePlanDate } from "./_hooks/usePlanDate";

export default function DatePage() {
  const {
    selectedTransport,
    setSelectedTransport,
    dateRange,
    setDateRange,
    canContinue,
    goToSchedule,
  } = usePlanDate();

  return (
    <div className="flex min-h-dvh flex-col">
      <MenuTitle>여행 기본 정보</MenuTitle>
      <Inner styles="flex-1">
        <main className="pt-30 pb-10">
          <section className="flex flex-col gap-3 mb-40">
            <Title>언제, 어떻게 떠나시나요</Title>
            <Desc>
              이동수단과 날짜를 입력해 주시면
              <br />
              최적의 동선을 계산해드릴게요
            </Desc>
          </section>
          <section>
            <div className="flex flex-col gap-8">
              <fieldset>
                <legend className="text-b2 font-semibold text-semantic-800">
                  이동수단
                </legend>
                <div className="grid grid-cols-2 gap-3 w-full mt-2.5">
                  <RadioCard
                    name="transport"
                    value="car"
                    checked={selectedTransport === "car"}
                    onChange={setSelectedTransport}
                  >
                    자차
                  </RadioCard>
                  <RadioCard
                    name="transport"
                    value="public"
                    checked={selectedTransport === "public"}
                    onChange={setSelectedTransport}
                  >
                    대중교통
                  </RadioCard>
                </div>
              </fieldset>
              <DateInput
                label="여행 일자"
                value={dateRange}
                onChange={setDateRange}
                helperMessage="여행은 최대 5일까지 선택할 수 있어요"
              />
            </div>
          </section>
        </main>
      </Inner>

      <BottomActionBar
        primaryAction={{
          label: "다음",
          buttonBg: "blue",
          disabled: !canContinue,
          onClick: goToSchedule,
        }}
      />
    </div>
  );
}
