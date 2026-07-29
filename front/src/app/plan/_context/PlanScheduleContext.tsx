"use client";

import {
  createContext,
  useContext,
  useState,
  type ReactNode,
} from "react";

export type ScheduleItem = {
  id: string;
  name: string;
  travelTime?: string;
};

type PlanScheduleContextValue = {
  schedules: Record<string, ScheduleItem[]>;
  addScheduleItems: (day: string, items: ScheduleItem[]) => void;
  removeScheduleItem: (day: string, id: string) => void;
  reorderScheduleItems: (
    day: string,
    oldIndex: number,
    newIndex: number,
  ) => void;
};

const INITIAL_SCHEDULES: Record<string, ScheduleItem[]> = {
  day1: [
    { id: "haeundae", name: "해운대 해수욕장" },
    { id: "gwangalli", name: "광안리 해수욕장" },
    { id: "gamcheon", name: "감천문화마을" },
    { id: "seokbulsa", name: "석불사" },
  ],
};

const PlanScheduleContext = createContext<PlanScheduleContextValue | null>(
  null,
);

export function PlanScheduleProvider({ children }: { children: ReactNode }) {
  const [schedules, setSchedules] =
    useState<Record<string, ScheduleItem[]>>(INITIAL_SCHEDULES);

  const addScheduleItems = (day: string, items: ScheduleItem[]) => {
    setSchedules((current) => {
      const dayItems = current[day] || [];
      const existingIds = new Set(dayItems.map((item) => item.id));
      const newItems = items.filter((item) => !existingIds.has(item.id));

      return {
        ...current,
        [day]: [...dayItems, ...newItems],
      };
    });
  };

  const removeScheduleItem = (day: string, id: string) => {
    setSchedules((current) => ({
      ...current,
      [day]: (current[day] || []).filter((item) => item.id !== id),
    }));
  };

  const reorderScheduleItems = (
    day: string,
    oldIndex: number,
    newIndex: number,
  ) => {
    setSchedules((current) => {
      const items = [...(current[day] || [])];
      const [movedItem] = items.splice(oldIndex, 1);
      if (!movedItem) return current;

      items.splice(newIndex, 0, movedItem);
      return { ...current, [day]: items };
    });
  };

  return (
    <PlanScheduleContext.Provider
      value={{
        schedules,
        addScheduleItems,
        removeScheduleItem,
        reorderScheduleItems,
      }}
    >
      {children}
    </PlanScheduleContext.Provider>
  );
}

export function usePlanSchedule() {
  const context = useContext(PlanScheduleContext);

  if (!context) {
    throw new Error(
      "usePlanSchedule은 PlanScheduleProvider 안에서 사용해야 합니다.",
    );
  }

  return context;
}
