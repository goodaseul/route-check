export type TransportMode = "car" | "public" | "taxi" | "walk" | "bicycle";

export type SimulationPlaceRequest = {
  sequence: number;
  contentid: number;
  title: string;
  mapx: number;
  mapy: number;
  stay_duration_minutes?: number;
  visit_start_time?: string | null;
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

export type TransitInfoRequest = {
  origin: {
    contentid: number;
    mapx: number;
    mapy: number;
  };
  destination: {
    contentid: number;
    mapx: number;
    mapy: number;
  };
  transport_mode: TransportMode;
  include_alternatives?: boolean;
};

export type TransitInfoResponse = {
  origin_id: number;
  destination_id: number;
  selected_mode: TransportMode;
  distance_km: number;
  duration_minutes: number;
  alternatives: Record<string, TransitAlternative>;
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
  suggestions?: SimulationSuggestion[] | null;
};

export type SimulationSuggestion = {
  suggestion_id?: string | null;
  type?: string | null;
  title?: string | null;
  description?: string | null;
  day_number?: number | null;
  contentid?: number | null;
  applied_route?: string[] | null;
  operation?:
    | {
        type: "REORDER";
        day_number: number;
        ordered_contentids: number[];
      }
    | {
        type: "CHANGE_TRANSPORT";
        day_number: number;
        origin_contentid: number;
        destination_contentid: number;
        from_mode: TransportMode;
        to_mode: TransportMode;
        previous_duration_minutes: number;
        updated_duration_minutes: number;
        previous_estimated_fare: number;
        updated_estimated_fare: number;
      }
    | {
        type: "CHANGE_VISIT_TIME";
        day_number: number;
        contentid: number;
        from_time: string;
        to_time: string;
        reason: "PEAK_CONGESTION_OVERLAP" | "OUT_OF_OPERATING_HOURS";
      }
    | null;
};

export type SimulationComparison = {
  previous_score: number;
  updated_score: number;
  score_delta: number;
  previous_distance_km: number;
  updated_distance_km: number;
  distance_saved_km: number;
  previous_transit_minutes: number;
  updated_transit_minutes: number;
  transit_minutes_saved: number;
  previous_estimated_fare: number;
  updated_estimated_fare: number;
  estimated_fare_delta: number;
  previous_operating_hours_warnings: number;
  updated_operating_hours_warnings: number;
  previous_congestion_warnings: number;
  updated_congestion_warnings: number;
};

export type ApplyReorderSuggestionRequest = {
  itinerary: SimulationRequest;
  suggestion_id: string;
  day_number: number;
  ordered_contentids: number[];
};

export type ApplyReorderSuggestionResponse = {
  applied_suggestion_id: string;
  updated_itinerary: SimulationRequest;
  previous_result: SimulationResponse;
  updated_result: SimulationResponse;
  comparison: SimulationComparison;
};

export type ApplyTransportSuggestionRequest = {
  itinerary: SimulationRequest;
  suggestion_id: string;
  day_number: number;
  origin_contentid: number;
  destination_contentid: number;
  from_mode: TransportMode;
  to_mode: TransportMode;
};

export type ApplyTransportSuggestionResponse = ApplyReorderSuggestionResponse;

export type ApplyTimeSuggestionRequest = {
  itinerary: SimulationRequest;
  suggestion_id: string;
  day_number: number;
  contentid: number;
  from_time: string;
  to_time: string;
};

export type ApplyTimeSuggestionResponse = ApplyReorderSuggestionResponse;
