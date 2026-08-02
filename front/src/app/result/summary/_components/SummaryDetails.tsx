"use client";

import { usePlanScheduleStore } from "@/stores/usePlanScheduleStore";
import { useMemo } from "react";
import RoutePreview from "./RoutePreview";
import SummaryStatsCard from "./SummaryStatsCard";

type SummaryDetailsProps = {
  isPerfectScore: boolean;
  isConfirmed: boolean;
  date: string | null;
};

export default function SummaryDetails({
  isPerfectScore,
  isConfirmed,
  date,
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

  const summary = [
    {
      label: "총 이동 거리",
      value: "28.4km",
      change: isConfirmed ? "-4.2km" : undefined,
    },
    {
      label: "총 이동 시간",
      value: isConfirmed ? "2시간 10분" : "2시간 45분",
      change: isConfirmed ? "-35분" : undefined,
    },
    { label: "총 방문 장소 수", value: `${scheduleItems.length}곳` },
    {
      label: "전체 예상 소요 시간 (이동+체류)",
      value: isConfirmed ? "26시간 10분" : "26시간 30분",
      change: isConfirmed ? "-20분" : undefined,
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
