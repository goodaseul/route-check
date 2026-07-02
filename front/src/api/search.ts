import fetcher from "@/lib/api/fetcher";
import { SearchResponse } from "./types/search";

export default function fetchSearch(keyword: string): Promise<SearchResponse> {
  return fetcher<SearchResponse>("/api/search", {
    params: { keyword },
  });
}
