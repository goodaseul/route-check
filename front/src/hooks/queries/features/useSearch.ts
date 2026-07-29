import fetchSearch from "@/api/search";
import { SearchResponse } from "@/api/types/search";
import { useQuery } from "@tanstack/react-query";
import { searchKeys } from "./queryKeys";

export function useSearch({ keyword }: { keyword: string }) {
  return useQuery<SearchResponse>({
    queryKey: searchKeys.keyword(keyword),
    queryFn: () => fetchSearch(keyword),
    enabled: !!keyword,
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
}
