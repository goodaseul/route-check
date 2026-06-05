import { SearchResponse } from "./types/search";

export default async function fetchSearch(
  keyword: string,
): Promise<SearchResponse> {
  const params = new URLSearchParams({ keyword });
  const response = await fetch(`/api/search?${params}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) throw new Error(`Error : ${response.status}`);

  const data = await response.json();
  return data;
}
