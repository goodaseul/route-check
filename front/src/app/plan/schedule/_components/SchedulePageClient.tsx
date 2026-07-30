"use client";
import Button from "@/components/common/buttons/Button";
import DateInput from "@/components/common/date-input/DateInput";
import {
  getInclusiveDayCount,
  parseDateRange,
} from "@/components/common/date-input/date-format";
import MenuTitle from "@/components/common/menu-title/MenuTitle";
import Tab from "@/components/common/tab/Tab";
import Inner from "@/components/layout/Inner";
import {
  closestCenter,
  DndContext,
  DragEndEvent,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { useState } from "react";
import SortableScheduleItem from "./SortableScheduleItem";
import { useRouter } from "next/navigation";
import { usePlanSchedule } from "../../_context/PlanScheduleContext";

type SchedulePageClientProps = {
  date: string | null;
};

export default function SchedulePageClient({ date }: SchedulePageClientProps) {
  const router = useRouter();
  const {
    schedules,
    removeScheduleItem,
    reorderScheduleItems,
  } = usePlanSchedule();

  const handleAddPlace = () => {
    const params = new URLSearchParams({
      day: selectedDay,
    });

    router.push(`/plan/map?${params.toString()}`);
  };
  const dateRange = parseDateRange(date);

  const totalDays = dateRange ? getInclusiveDayCount(dateRange) : 0;
  const [selectedDay, setSelectedDay] = useState("day1");
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 6 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const dayTabItems = Array.from({ length: totalDays }, (_, index) => {
    const dayNum = index + 1;
    return {
      label: `Day ${dayNum}`,
      value: `day${dayNum}`,
    };
  });
  const selectedSchedule = schedules[selectedDay] || [];
  const hasSchedule = selectedSchedule.length > 0;

  const handleDragEnd = ({ active, over }: DragEndEvent) => {
    if (!over || active.id === over.id) return;

    const oldIndex = selectedSchedule.findIndex(
      (item) => item.id === active.id,
    );
    const newIndex = selectedSchedule.findIndex(
      (item) => item.id === over.id,
    );

    if (oldIndex < 0 || newIndex < 0) return;
    reorderScheduleItems(selectedDay, oldIndex, newIndex);
  };

  const removeSchedule = (id: string) => {
    removeScheduleItem(selectedDay, id);
  };

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

            <Button onClick={handleAddPlace} className="mt-5">
              + 장소추가
            </Button>
          </section>
        </main>
      </Inner>

      <div className="sticky bottom-0 mt-auto bg-semantic-100 px-6 pt-4 pb-6">
        <Button
          buttonBg="blue"
          disabled={!hasSchedule}
          onClick={() => router.push("/result/summary")}
        >
          일정 분석
        </Button>
      </div>
    </div>
  );
}
