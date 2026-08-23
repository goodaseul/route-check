"use client";

import { formatDateRange } from "@/components/common/date-input/date-format";
import { usePlanScheduleStore } from "@/stores/usePlanScheduleStore";
import type { DateRange } from "@daypicker/react";
import { useRouter } from "next/navigation";
import { useState } from "react";

export type Transport = "car" | "public";

export function usePlanDate() {
  const router = useRouter();
  const [selectedTransport, setSelectedTransport] = useState<Transport | null>(
    null,
  );
  const [dateRange, setDateRange] = useState<DateRange>();
  const canContinue = Boolean(selectedTransport && dateRange?.from);

  const resetSchedules = usePlanScheduleStore((state) => state.resetSchedules);

  const goToSchedule = () => {
    if (!selectedTransport || !dateRange?.from) return;

    resetSchedules();

    const searchParams = new URLSearchParams({
      transport: selectedTransport,
      date: formatDateRange(dateRange),
    });
    router.push(`/plan/schedule?${searchParams.toString()}`);
  };

  return {
    selectedTransport,
    setSelectedTransport,
    dateRange,
    setDateRange,
    canContinue,
    goToSchedule,
  };
}
