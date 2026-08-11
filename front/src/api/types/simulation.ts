export type TransportMode = "car" | "public" | "taxi" | "walk" | "bicycle";

export type SimulationPlaceRequest = {
  sequence: number;
  contentid: number;
  title: string;
  mapx: number;
  mapy: number;
  stay_duration_minutes?: number;
  transport_mode_to_next?: TransportMode | null;
};

export type SimulationRequest = {
  start_date: string;
  end_date: string;
  transport_mode: TransportMode;
  days: Array<{
    day_number: number;
    date: string;
    places: SimulationPlaceRequest[];
  }>;
};

export type TransitAlternative = {
  distance_km: number;
  duration_minutes: number;
  estimated_fare?: number | null;
  source?: "api" | "cache" | "heuristics" | null;
};

export type SimulationResponse = {
  overall_score: number;
  status_label: string;
  status_description: string;
  summary: {
    total_distance_km: number;
    total_transit_time_minutes: number;
    total_places_count: number;
    total_duration_minutes: number;
  };
  timeline: Array<{
    day_number: number;
    date: string;
    schedule: Array<{
      sequence: number;
      contentid: number;
      title: string;
      start_time: string;
      end_time: string;
      stay_duration_minutes: number;
      congestion: {
        peak_start: string;
        peak_end: string;
        is_overlap: boolean;
        basis: string;
      };
      transit_to_next: null | (TransitAlternative & {
        mode: TransportMode;
        recommended_mode?: TransportMode | null;
        alternatives: Record<string, TransitAlternative>;
      });
    }>;
  }>;
  warnings: Array<{
    type: string;
    day_number: number;
    contentid?: number | null;
    title?: string | null;
    message: string;
  }>;
  total_score?: number | null;
  status_message?: string | null;
  analysis_summary?: Record<string, string> | null;
  suggestions?: Array<Record<string, unknown>> | null;
};
