"use client";

import {
  formatApiDate,
  getInclusiveDayCount,
  parseDateRange,
} from "@/components/common/date-input/date-format";
import { analyzeSimulation, fetchTransitInfo } from "@/api/simulation";
import type { SimulationRequest, TransportMode } from "@/api/types/simulation";
import { showToast } from "@/lib/utils/toast";
import { transitKeys } from "@/hooks/queries/features/queryKeys";
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
import { useQueries } from "@tanstack/react-query";

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
  const transitQueries = useQueries({
    queries: selectedSchedule.slice(0, -1).map((origin, index) => {
      const destination = selectedSchedule[index + 1];
      const coordinates = [
        origin.lat,
        origin.lng,
        destination?.lat,
        destination?.lng,
      ] as const;
      const hasCoordinates = coordinates.every(
        (coordinate) => typeof coordinate === "number",
      );

      return {
        queryKey: transitKeys.segment(
          origin.contentId,
          destination?.contentId ?? 0,
          transport,
          coordinates.map((coordinate) => coordinate ?? 0),
        ),
        queryFn: () =>
          fetchTransitInfo({
            origin: {
              contentid: origin.contentId,
              mapx: origin.lng!,
              mapy: origin.lat!,
            },
            destination: {
              contentid: destination!.contentId,
              mapx: destination!.lng!,
              mapy: destination!.lat!,
            },
            transport_mode: transport,
            include_alternatives: false,
          }),
        enabled: Boolean(destination && hasCoordinates),
        staleTime: 24 * 60 * 60 * 1000,
        gcTime: 24 * 60 * 60 * 1000,
        refetchOnWindowFocus: false,
        retry: 1,
      };
    }),
  });
  const scheduleWithTransitTimes = selectedSchedule.map((item, index) => {
    if (index === selectedSchedule.length - 1) return item;

    const query = transitQueries[index];
    let travelTime = "이동시간 분석 예정";
    if (query?.isPending) travelTime = "이동시간 계산 중...";
    if (query?.isError) travelTime = "이동시간을 확인할 수 없어요";
    if (query?.data) {
      const modeLabel = transport === "car" ? "자차" : "대중교통";
      const estimatePrefix =
        query.data.alternatives[transport]?.source === "heuristics" ? "약 " : "";
      travelTime = `${modeLabel} ${estimatePrefix}${query.data.duration_minutes}분 소요`;
    }
    return { ...item, travelTime };
  });

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
    selectedSchedule: scheduleWithTransitTimes,
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
