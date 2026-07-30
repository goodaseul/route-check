"use client";

import { usePlanSchedule } from "@/app/plan/_context/PlanScheduleContext";
import { useMemo } from "react";
import RoutePreview from "./RoutePreview";
import SummaryStatsCard from "./SummaryStatsCard";

type SummaryDetailsProps = {
  isPerfectScore: boolean;
};

export default function SummaryDetails({
  isPerfectScore,
}: SummaryDetailsProps) {
  const { schedules } = usePlanSchedule();
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
    { label: "총 이동 거리", value: "28.4km" },
    { label: "총 이동 시간", value: "2시간 45분" },
    { label: "총 방문 장소 수", value: `${scheduleItems.length}곳` },
    {
      label: "전체 예상 소요 시간 (이동+체류)",
      value: "26시간 30분",
    },
  ];

  return (
    <>
      <SummaryStatsCard stats={summary} />
      <RoutePreview
        positions={positions}
        isPerfectScore={isPerfectScore}
      />
    </>
  );
}
