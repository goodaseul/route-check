const BASE_URL = "https://apis.data.go.kr";

const DEFAULT_PARAMS = {
  serviceKey: process.env.NEXT_PUBLIC_DECODING_AUTH_KEY as string,
  MobileOS: "ETC",
  MobileApp: "MyApp",
  _type: "json",
};

export const fetcher = async <T>(
  path: string,
  params?: Record<string, string | number>,
): Promise<T> => {
  const searchParams = new URLSearchParams({
    ...DEFAULT_PARAMS,
    ...(params as Record<string, string>),
  });

  const response = await fetch(`${BASE_URL}${path}?${searchParams}`);
  if (!response.ok) throw new Error(`HTTP error! ${response.status}`);
  return response.json();
};
