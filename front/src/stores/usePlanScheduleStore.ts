"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

export type ScheduleItem = {
  id: string;
  name: string;
  travelTime?: string;
  lat?: number;
  lng?: number;
};

type PlanScheduleState = {
  schedules: Record<string, ScheduleItem[]>;
  addScheduleItems: (day: string, items: ScheduleItem[]) => void;
  removeScheduleItem: (day: string, id: string) => void;
  reorderScheduleItems: (
    day: string,
    oldIndex: number,
    newIndex: number,
  ) => void;
  resetSchedules: () => void;
};

export const usePlanScheduleStore = create<PlanScheduleState>()(
  persist(
    (set) => ({
      schedules: {},

      addScheduleItems: (day, items) => {
        set((state) => {
          const dayItems = state.schedules[day] || [];
          const existingIds = new Set(dayItems.map((item) => item.id));
          const newItems = items.filter((item) => !existingIds.has(item.id));

          return {
            schedules: {
              ...state.schedules,
              [day]: [...dayItems, ...newItems],
            },
          };
        });
      },

      removeScheduleItem: (day, id) => {
        set((state) => ({
          schedules: {
            ...state.schedules,
            [day]: (state.schedules[day] || []).filter(
              (item) => item.id !== id,
            ),
          },
        }));
      },

      reorderScheduleItems: (day, oldIndex, newIndex) => {
        set((state) => {
          const items = [...(state.schedules[day] || [])];
          const [movedItem] = items.splice(oldIndex, 1);
          if (!movedItem) return state;

          items.splice(newIndex, 0, movedItem);
          return {
            schedules: {
              ...state.schedules,
              [day]: items,
            },
          };
        });
      },

      resetSchedules: () => set({ schedules: {} }),
    }),
    {
      name: "route-check-plan-schedules",
      version: 1,
      skipHydration: true,
      partialize: (state) => ({ schedules: state.schedules }),
    },
  ),
);
