import fetcher from "@/lib/api/fetcher";
import type { RecommendationResponse } from "./types/search";

export type RecommendationParams = {
  areaCode?: string;
  sigunguCode?: string;
  contentTypeId?: string;
  numOfRows?: number;
};

export default function fetchRecommendations({
  areaCode,
  sigunguCode,
  contentTypeId,
  numOfRows = 4,
}: RecommendationParams = {}): Promise<RecommendationResponse> {
  const params = new URLSearchParams({ numOfRows: String(numOfRows) });
  if (areaCode) params.set("areaCode", areaCode);
  if (sigunguCode) params.set("sigunguCode", sigunguCode);
  if (contentTypeId) params.set("contentTypeId", contentTypeId);

  return fetcher<RecommendationResponse>(`/api/recommendations?${params}`);
}
