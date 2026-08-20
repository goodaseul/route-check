import fetcher from "@/lib/api/fetcher";
import type {
  SimulationRequest,
  SimulationResponse,
  TransitInfoRequest,
  TransitInfoResponse,
  ApplyReorderSuggestionRequest,
  ApplyReorderSuggestionResponse,
} from "./types/simulation";

export function analyzeSimulation(body: SimulationRequest) {
  return fetcher<SimulationResponse>("/api/simulation/analyze", {
    method: "POST",
    body,
  });
}

export function fetchTransitInfo(body: TransitInfoRequest) {
  return fetcher<TransitInfoResponse>("/api/route/transit-info", {
    method: "POST",
    body,
  });
}

export function applyReorderSuggestion(body: ApplyReorderSuggestionRequest) {
  return fetcher<ApplyReorderSuggestionResponse>(
    "/api/simulation/apply-reorder",
    {
      method: "POST",
      body,
    },
  );
}
