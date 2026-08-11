"use client";

import { usePlanScheduleStore } from "@/stores/usePlanScheduleStore";
import { useMemo } from "react";
import type { SimulationResponse } from "@/api/types/simulation";
import RoutePreview from "./RoutePreview";
import SummaryStatsCard from "./SummaryStatsCard";

type SummaryDetailsProps = {
  isPerfectScore: boolean;
  isConfirmed: boolean;
  date: string | null;
  result: SimulationResponse;
};

export default function SummaryDetails({
  isPerfectScore,
  isConfirmed,
  date,
  result,
}: SummaryDetailsProps) {
  const schedules = usePlanScheduleStore((state) => state.schedules);
  const scheduleItems = Object.values(schedules).flat();
  const positions = useMemo(
    () =>
      scheduleItems
        .filter(
          (
            item,
          ): item is typeof item & Required<Pick<typeof item, "lat" | "lng">> =>
            typeof item.lat === "number" && typeof item.lng === "number",
        )
        .map(({ lat, lng }) => ({ lat, lng })),
    [scheduleItems],
  );

  const formatMinutes = (minutes: number) =>
    minutes >= 60
      ? `${Math.floor(minutes / 60)}시간 ${minutes % 60}분`
      : `${minutes}분`;
  const summary = [
    {
      label: "총 이동 거리",
      value: `${result.summary.total_distance_km}km`,
    },
    {
      label: "총 이동 시간",
      value: formatMinutes(result.summary.total_transit_time_minutes),
    },
    { label: "총 방문 장소 수", value: `${result.summary.total_places_count}곳` },
    {
      label: "전체 예상 소요 시간 (이동+체류)",
      value: formatMinutes(result.summary.total_duration_minutes),
    },
  ];

  return (
    <>
      <SummaryStatsCard stats={summary} />
      <RoutePreview
        positions={positions}
        isPerfectScore={isPerfectScore}
        isConfirmed={isConfirmed}
        date={date}
      />
    </>
  );
}
