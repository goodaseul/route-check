"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type {
  SimulationComparison,
  SimulationRequest,
  SimulationResponse,
  TransportMode,
} from "@/api/types/simulation";

export type ScheduleItem = {
  id: string;
  contentId: number;
  name: string;
  address?: string;
  imageSrc?: string | null;
  travelTime?: string;
  lat?: number;
  lng?: number;
  transportModeToNext?: TransportMode;
  visitStartTime?: string;
};

type PlanScheduleState = {
  schedules: Record<string, ScheduleItem[]>;
  analysisResult: import("@/api/types/simulation").SimulationResponse | null;
  analysisRequest: SimulationRequest | null;
  previousAnalysisResult: SimulationResponse | null;
  analysisComparison: SimulationComparison | null;
  lastAppliedSuggestionId: string | null;
  addScheduleItems: (day: string, items: ScheduleItem[]) => void;
  removeScheduleItem: (day: string, id: string) => void;
  reorderScheduleItems: (
    day: string,
    oldIndex: number,
    newIndex: number,
  ) => void;
  resetSchedules: () => void;
  setAnalysisResult: (
    result: import("@/api/types/simulation").SimulationResponse | null,
  ) => void;
  setAnalysis: (request: SimulationRequest, result: SimulationResponse) => void;
  applyReorderResult: (params: {
    day: string;
    orderedContentIds: number[];
    request: SimulationRequest;
    previousResult: SimulationResponse;
    updatedResult: SimulationResponse;
    comparison: SimulationComparison;
    suggestionId: string;
  }) => void;
  applyTransportResult: (params: {
    day: string;
    originContentId: number;
    transportMode: TransportMode;
    request: SimulationRequest;
    previousResult: SimulationResponse;
    updatedResult: SimulationResponse;
    comparison: SimulationComparison;
    suggestionId: string;
  }) => void;
  applyTimeResult: (params: {
    day: string;
    contentId: number;
    visitStartTime: string;
    request: SimulationRequest;
    previousResult: SimulationResponse;
    updatedResult: SimulationResponse;
    comparison: SimulationComparison;
    suggestionId: string;
  }) => void;
  applyTripResult: (params: {
    request: SimulationRequest;
    previousResult: SimulationResponse;
    updatedResult: SimulationResponse;
    comparison: SimulationComparison;
    suggestionId: string;
  }) => void;
};

export const usePlanScheduleStore = create<PlanScheduleState>()(
  persist(
    (set) => ({
      schedules: {},
      analysisResult: null,
      analysisRequest: null,
      previousAnalysisResult: null,
      analysisComparison: null,
      lastAppliedSuggestionId: null,

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

      resetSchedules: () =>
        set({
          schedules: {},
          analysisResult: null,
          analysisRequest: null,
          previousAnalysisResult: null,
          analysisComparison: null,
          lastAppliedSuggestionId: null,
        }),
      setAnalysisResult: (analysisResult) => set({ analysisResult }),
      setAnalysis: (analysisRequest, analysisResult) =>
        set({
          analysisRequest,
          analysisResult,
          previousAnalysisResult: null,
          analysisComparison: null,
          lastAppliedSuggestionId: null,
        }),
      applyReorderResult: ({
        day,
        orderedContentIds,
        request,
        previousResult,
        updatedResult,
        comparison,
        suggestionId,
      }) =>
        set((state) => {
          const items = state.schedules[day] ?? [];
          const itemByContentId = new Map(
            items.map((item) => [item.contentId, item]),
          );
          const reordered = orderedContentIds.flatMap((contentId) => {
            const item = itemByContentId.get(contentId);
            return item ? [item] : [];
          });

          return {
            schedules: { ...state.schedules, [day]: reordered },
            analysisRequest: request,
            previousAnalysisResult: previousResult,
            analysisResult: updatedResult,
            analysisComparison: comparison,
            lastAppliedSuggestionId: suggestionId,
          };
        }),
      applyTransportResult: ({
        day,
        originContentId,
        transportMode,
        request,
        previousResult,
        updatedResult,
        comparison,
        suggestionId,
      }) =>
        set((state) => ({
          schedules: {
            ...state.schedules,
            [day]: (state.schedules[day] ?? []).map((item) =>
              item.contentId === originContentId
                ? { ...item, transportModeToNext: transportMode }
                : item,
            ),
          },
          analysisRequest: request,
          previousAnalysisResult: previousResult,
          analysisResult: updatedResult,
          analysisComparison: comparison,
          lastAppliedSuggestionId: suggestionId,
        })),
      applyTimeResult: ({
        day,
        contentId,
        visitStartTime,
        request,
        previousResult,
        updatedResult,
        comparison,
        suggestionId,
      }) =>
        set((state) => ({
          schedules: {
            ...state.schedules,
            [day]: (state.schedules[day] ?? []).map((item) =>
              item.contentId === contentId
                ? { ...item, visitStartTime }
                : item,
            ),
          },
          analysisRequest: request,
          previousAnalysisResult: previousResult,
          analysisResult: updatedResult,
          analysisComparison: comparison,
          lastAppliedSuggestionId: suggestionId,
        })),
      applyTripResult: ({
        request,
        previousResult,
        updatedResult,
        comparison,
        suggestionId,
      }) =>
        set((state) => {
          const existingItems = new Map(
            Object.values(state.schedules)
              .flat()
              .map((item) => [item.contentId, item]),
          );
          const schedules = Object.fromEntries(
            request.days.map((day) => [
              `day${day.day_number}`,
              day.places.map((place) => {
                const existing = existingItems.get(place.contentid);
                return {
                  id: existing?.id ?? String(place.contentid),
                  contentId: place.contentid,
                  name: place.title,
                  address: existing?.address,
                  imageSrc: existing?.imageSrc,
                  lat: place.mapy,
                  lng: place.mapx,
                  transportModeToNext: place.transport_mode_to_next ?? undefined,
                  visitStartTime: place.visit_start_time ?? undefined,
                } satisfies ScheduleItem;
              }),
            ]),
          );
          return {
            schedules,
            analysisRequest: request,
            previousAnalysisResult: previousResult,
            analysisResult: updatedResult,
            analysisComparison: comparison,
            lastAppliedSuggestionId: suggestionId,
          };
        }),
    }),
    {
      name: "route-check-plan-schedules",
      version: 2,
      skipHydration: true,
      partialize: (state) => ({
        schedules: state.schedules,
        analysisResult: state.analysisResult,
        analysisRequest: state.analysisRequest,
        previousAnalysisResult: state.previousAnalysisResult,
        analysisComparison: state.analysisComparison,
        lastAppliedSuggestionId: state.lastAppliedSuggestionId,
      }),
    },
  ),
);
