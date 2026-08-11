import fetchRecommendations from "@/api/recommendations";
import type { RecommendationResponse } from "@/api/types/search";
import { useQuery } from "@tanstack/react-query";
import { recommendationKeys } from "./queryKeys";

export function useRecommendations(areaCode?: string) {
  return useQuery<RecommendationResponse>({
    queryKey: recommendationKeys.list(areaCode),
    queryFn: () => fetchRecommendations({ areaCode, numOfRows: 4 }),
    staleTime: 30 * 60 * 1000,
    gcTime: 60 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
}
