"use client";

import DateInput from "@/components/common/date-input/DateInput";
import Desc from "@/components/common/desc/Desc";
import MenuTitle from "@/components/common/menu-title/MenuTitle";
import RadioCard from "@/components/common/radio-card/RadioCard";
import Title from "@/components/common/title/Title";
import Inner from "@/components/layout/Inner";
import Button from "@/components/common/buttons/Button";
import type { DateRange } from "@daypicker/react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { formatDateRange } from "@/components/common/date-input/date-format";

type Transport = "car" | "public";

export default function PlanPage() {
  const router = useRouter();

  const [selectedTransport, setSelectedTransport] = useState<Transport | null>(
    null,
  );
  const [dateRange, setDateRange] = useState<DateRange>();
  const canContinue = Boolean(selectedTransport && dateRange?.from);

  const handleNext = () => {
    if (!selectedTransport || !dateRange?.from) return;

    const searchParams = new URLSearchParams({
      transport: selectedTransport,
      date: formatDateRange(dateRange),
    });
    router.push(`/map?${searchParams.toString()}`);
  };

  return (
    <>
      <MenuTitle>여행 기본 정보</MenuTitle>
      <Inner>
        <main className="pt-30 pb-10">
          <section className="flex flex-col gap-3 mb-40">
            <Title>언제, 어떻게 떠나시나요</Title>
            <Desc>
              이동수단과 날짜를 입력해 주시면
              <br />
              최적의 동선을 계산해드릴게요
            </Desc>
          </section>
          <form
            className="flex flex-col gap-8"
            onSubmit={(event) => {
              event.preventDefault();
              handleNext();
            }}
          >
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
            />
            <Button
              type="submit"
              buttonBg="blue"
              disabled={!canContinue}
            >
              다음
            </Button>
          </form>
        </main>
      </Inner>
    </>
  );
}
