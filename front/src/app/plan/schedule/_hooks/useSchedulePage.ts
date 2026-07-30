"use client";

import {
  getInclusiveDayCount,
  parseDateRange,
} from "@/components/common/date-input/date-format";
import { usePlanScheduleStore } from "@/stores/usePlanScheduleStore";
import {
  type DragEndEvent,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { sortableKeyboardCoordinates } from "@dnd-kit/sortable";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function useSchedulePage(date: string | null) {
  const router = useRouter();
  const schedules = usePlanScheduleStore((state) => state.schedules);
  const removeScheduleItem = usePlanScheduleStore(
    (state) => state.removeScheduleItem,
  );
  const reorderScheduleItems = usePlanScheduleStore(
    (state) => state.reorderScheduleItems,
  );
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
  const dayTabItems = Array.from({ length: totalDays }, (_, index) => ({
    label: `Day ${index + 1}`,
    value: `day${index + 1}`,
  }));
  const selectedSchedule = schedules[selectedDay] ?? [];
  const hasSchedule = selectedSchedule.length > 0;

  const addPlace = () => {
    const params = new URLSearchParams({ day: selectedDay });
    router.push(`/plan/map?${params.toString()}`);
  };

  const analyzeSchedule = () => {
    router.push("/result/summary");
  };

  const handleDragEnd = ({ active, over }: DragEndEvent) => {
    if (!over || active.id === over.id) return;

    const oldIndex = selectedSchedule.findIndex(
      (item) => item.id === active.id,
    );
    const newIndex = selectedSchedule.findIndex((item) => item.id === over.id);

    if (oldIndex < 0 || newIndex < 0) return;
    reorderScheduleItems(selectedDay, oldIndex, newIndex);
  };

  const removeSchedule = (id: string) => {
    removeScheduleItem(selectedDay, id);
  };

  return {
    dateRange,
    selectedDay,
    setSelectedDay,
    sensors,
    dayTabItems,
    selectedSchedule,
    hasSchedule,
    addPlace,
    analyzeSchedule,
    handleDragEnd,
    removeSchedule,
  };
}
