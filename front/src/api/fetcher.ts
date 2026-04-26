const BASE_URL = "https://apis.data.go.kr/B551011/KorService2";

export const fetcher = async (
  endpoint: string,
  params?: Record<string, string>,
) => {
  const searchParams = new URLSearchParams({
    serviceKey: process.env.NEXT_PUBLIC_DECODING_AUTH_KEY as string,
    MobileOS: "ETC",
    MobileApp: "MyApp",
    _type: "json",
    ...params,
  });
  const response = await fetch(`${BASE_URL}${endpoint}?${searchParams}`);
  if (!response.ok) throw new Error(`HTTP error! ${response.status}`);
  return response.json();
};
