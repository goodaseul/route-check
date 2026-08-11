import fetcher from "@/lib/api/fetcher";
import type {
  SimulationRequest,
  SimulationResponse,
} from "./types/simulation";

export function analyzeSimulation(body: SimulationRequest) {
  return fetcher<SimulationResponse>("/api/simulation/analyze", {
    method: "POST",
    body,
  });
}
