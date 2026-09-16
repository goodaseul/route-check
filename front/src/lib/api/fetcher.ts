type FetcherOptions = {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  params?: Record<string, string>;
  body?: unknown;
};

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";

export default async function fetcher<T>(
  url: string,
  options: FetcherOptions = {},
): Promise<T> {
  const { method = "GET", params, body } = options;

  const query = params ? `?${new URLSearchParams(params)}` : "";

  const fullUrl = `${API_BASE_URL}${url}${query}`;

  const response = await fetch(fullUrl, {
    method,
    headers: {
      "Content-Type": "application/json",
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });

  if (!response.ok) throw new Error(`Error: ${response.status}`);

  const data = await response.json();

  return data;
}
