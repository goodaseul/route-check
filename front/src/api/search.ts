import fetcher from "@/lib/api/fetcher";
import { SearchResponse } from "./types/search";

export default function fetchSearch(keyword: string): Promise<SearchResponse> {
  const query = new URLSearchParams({
    keyword,
    numOfRows: "10",
  }).toString();
  return fetcher<SearchResponse>(`/api/search?${query}`);
}
