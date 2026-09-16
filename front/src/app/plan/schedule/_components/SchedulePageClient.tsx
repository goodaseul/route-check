"use client";
import Button from "@/components/common/buttons/Button";
import BottomActionBar from "@/components/common/buttons/BottomActionBar";
import DateInput from "@/components/common/date-input/DateInput";
import MenuTitle from "@/components/common/menu-title/MenuTitle";
import Tab from "@/components/common/tab/Tab";
import Inner from "@/components/layout/Inner";
import {
  closestCenter,
  DndContext,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import SortableScheduleItem from "./SortableScheduleItem";
import { useSchedulePage } from "../_hooks/useSchedulePage";

type SchedulePageClientProps = {
  date: string | null;
  transport: "car" | "public";
};

export default function SchedulePageClient({
  date,
  transport,
}: SchedulePageClientProps) {
  const router = useRouter();
  const {
    dateRange,
    selectedDay,
    setSelectedDay,
    sensors,
    dayTabItems,
    selectedSchedule,
    hasSchedule,
    isAnalyzing,
    addPlace,
    analyzeSchedule,
    handleDragEnd,
    removeSchedule,
  } = useSchedulePage(date, transport);

  useEffect(() => {
    if (!dateRange) {
      router.replace("/plan/date");
    }
  }, [dateRange, router]);

  if (!dateRange) {
    return (
      <div className="flex min-h-dvh flex-col">
        <MenuTitle onAction={() => router.push("/plan/date")}>
          일정 구성
        </MenuTitle>
        <Inner>
          <div className="py-20 flex flex-col items-center justify-center text-center">
            <p className="text-h3 font-semibold text-semantic-800">
              여행 일정이 선택되지 않았어요
            </p>
            <p className="mt-2 text-b2 text-semantic-600">
              먼저 여행 날짜와 이동 수단을 선택해 주세요.
            </p>
            <div className="mt-8 w-full max-w-xs">
              <Button buttonBg="blue" onClick={() => router.push("/plan/date")}>
                여행 날짜 선택하기
              </Button>
            </div>
          </div>
        </Inner>
      </div>
    );
  }

  return (
    <div className="flex min-h-dvh flex-col">
      <MenuTitle>일정 구성</MenuTitle>
      <Inner>
        <main className="flex flex-1 flex-col pt-10">
          <section>
            <DateInput disabled label="여행 일자" value={dateRange} />

            <Tab
              className="mt-14 mb-10"
              items={dayTabItems}
              value={selectedDay}
              onChange={setSelectedDay}
            />
          </section>

          <section className="flex-1">
            {hasSchedule ? (
              <DndContext
                id="schedule-sortable"
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
              >
                <SortableContext
                  items={selectedSchedule.map((item) => item.id)}
                  strategy={verticalListSortingStrategy}
                >
                  <ol className="overflow-hidden rounded-btn">
                    {selectedSchedule.map((item, index) => (
                      <SortableScheduleItem
                        key={item.id}
                        item={item}
                        order={index + 1}
                        isLast={index === selectedSchedule.length - 1}
                        onRemove={removeSchedule}
                      />
                    ))}
                  </ol>
                </SortableContext>
              </DndContext>
            ) : (
              <div className="rounded-card bg-semantic-300 py-23.5 text-center">
                <p className="text-h3-sm font-semibold text-semantic-800">
                  아직 추가된 장소가 없어요
                </p>
                <p className="mt-1.5 text-b3 text-semantic-600">
                  아래 버튼을 눌러 장소를 추가해보세요
                </p>
              </div>
            )}

            <Button onClick={addPlace} className="mt-5">
              + 장소추가
            </Button>
          </section>
        </main>
      </Inner>

      <BottomActionBar
        primaryAction={{
          label: isAnalyzing ? "일정 분석 중..." : "일정 분석",
          buttonBg: "blue",
          disabled: !hasSchedule || isAnalyzing,
          onClick: analyzeSchedule,
        }}
      />
    </div>
  );
}
