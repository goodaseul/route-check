"use client";

import {
  formatApiDate,
  getInclusiveDayCount,
  parseDateRange,
} from "@/components/common/date-input/date-format";
import { analyzeSimulation } from "@/api/simulation";
import type { SimulationRequest, TransportMode } from "@/api/types/simulation";
import { showToast } from "@/lib/utils/toast";
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

export function useSchedulePage(
  date: string | null,
  transport: "car" | "public",
) {
  const router = useRouter();
  const schedules = usePlanScheduleStore((state) => state.schedules);
  const removeScheduleItem = usePlanScheduleStore(
    (state) => state.removeScheduleItem,
  );
  const reorderScheduleItems = usePlanScheduleStore(
    (state) => state.reorderScheduleItems,
  );
  const setAnalysisResult = usePlanScheduleStore(
    (state) => state.setAnalysisResult,
  );
  const dateRange = parseDateRange(date);
  const totalDays = dateRange ? getInclusiveDayCount(dateRange) : 0;
  const [selectedDay, setSelectedDay] = useState("day1");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
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

  const analyzeSchedule = async () => {
    if (!dateRange?.from || isAnalyzing) return;

    const request = createSimulationRequest(
      schedules,
      dateRange.from,
      dateRange.to ?? dateRange.from,
      transport,
    );
    if (!request.days.some((day) => day.places.length > 0)) {
      showToast("좌표가 있는 장소를 한 곳 이상 추가해 주세요.");
      return;
    }

    setIsAnalyzing(true);
    try {
      const result = await analyzeSimulation(request);
      setAnalysisResult(result);
      const params = new URLSearchParams();
      if (date) params.set("date", date);
      params.set("transport", transport);
      const query = params.toString();
      router.push(`/result/summary${query ? `?${query}` : ""}`);
    } catch {
      showToast("일정 분석에 실패했어요. 잠시 후 다시 시도해 주세요.");
    } finally {
      setIsAnalyzing(false);
    }
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
    isAnalyzing,
    addPlace,
    analyzeSchedule,
    handleDragEnd,
    removeSchedule,
  };
}

function createSimulationRequest(
  schedules: ReturnType<typeof usePlanScheduleStore.getState>["schedules"],
  startDate: Date,
  endDate: Date,
  transportMode: TransportMode,
): SimulationRequest {
  const days: SimulationRequest["days"] = [];
  const cursor = new Date(startDate);
  let dayNumber = 1;

  while (cursor <= endDate) {
    const items = schedules[`day${dayNumber}`] ?? [];
    days.push({
      day_number: dayNumber,
      date: formatApiDate(cursor),
      places: items.flatMap((item, index) =>
        typeof item.contentId === "number" &&
        typeof item.lat === "number" &&
        typeof item.lng === "number"
          ? [
              {
                sequence: index + 1,
                contentid: item.contentId,
                title: item.name,
                mapx: item.lng,
                mapy: item.lat,
              },
            ]
          : [],
      ),
    });
    cursor.setDate(cursor.getDate() + 1);
    dayNumber += 1;
  }

  return {
    start_date: formatApiDate(startDate),
    end_date: formatApiDate(endDate),
    transport_mode: transportMode,
    days,
  };
}
